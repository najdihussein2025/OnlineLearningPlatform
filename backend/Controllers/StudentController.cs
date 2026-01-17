using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Identity;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.QuizAttempt;
using ids.Data.DTOs.Student;
using ids.Data.DTOs.User;
using ids.Services;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StudentController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly CertificatePdfService _pdfService;
        private readonly PasswordHasher<User> _passwordHasher;

        public StudentController(AppDbContext context, IConfiguration configuration, CertificatePdfService pdfService)
        {
            _context = context;
            _configuration = configuration;
            _pdfService = pdfService;
            _passwordHasher = new PasswordHasher<User>();
        }

        [HttpGet("dashboard")]
        [Authorize(Roles = "Student")]
        public async Task<ActionResult<DashboardDto>> GetDashboard()
        {
            try
            {
                // Get logged-in userId from JWT claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                // Get all enrollments for the user
                var enrollments = await _context.Enrollments
                    .Where(e => e.UserId == userId)
                    .Include(e => e.Course)
                    .ToListAsync();

                // If no enrollments, return empty dashboard (NOT error)
                if (enrollments == null || enrollments.Count == 0)
                {
                    return Ok(new
                    {
                        totalCourses = 0,
                        completedCourses = 0,
                        inProgressCourses = 0,
                        totalLessons = 0,
                        completedLessons = 0,
                        overallProgress = 0.0,
                        lastAccessedLessonDate = (DateTime?)null,
                        courses = new List<object>()
                    });
                }

                var courses = new List<CourseProgressDto>();
                int completedCourses = 0;
                int inProgressCourses = 0;
                double totalCompletionPercentage = 0;

                foreach (var enrollment in enrollments ?? new List<Enrollment>())
                {
                    try
                    {
                        // Skip if enrollment or course is null (defensive check)
                        if (enrollment == null || enrollment.Course == null)
                        {
                            continue;
                        }

                        var courseId = enrollment.Course.Id;
                        
                        // Check and update course completion status before calculating stats
                        // Wrap in try-catch to handle any errors in completion check
                        try
                        {
                            await CheckAndUpdateCourseCompletion(userId, courseId);
                        }
                        catch (Exception ex)
                        {
                            // Log but continue - completion check failure shouldn't break the dashboard
                            Console.WriteLine($"Error checking course completion for course {courseId}: {ex.Message}");
                        }
                        
                        // Re-fetch enrollment to get updated status (safer than ReloadAsync)
                        // Include Course to ensure it's available
                        var updatedEnrollment = await _context.Enrollments
                            .Include(e => e.Course)
                            .FirstOrDefaultAsync(e => e.Id == enrollment.Id);
                        
                        if (updatedEnrollment == null || updatedEnrollment.Course == null)
                        {
                            continue;
                        }
                
                        // Get total counts - safe even if no lessons/quizzes exist
                        var totalLessons = await _context.Lessons
                            .Where(l => l.CourseId == courseId)
                            .CountAsync();
                        var totalQuizzes = await _context.Quizzes
                            .Where(q => q.CourseId == courseId)
                            .CountAsync();

                        // Get completed lessons (distinct lesson IDs completed by this user in this course)
                        // Use safe join that handles orphaned records
                        var completedLessonIds = new List<int>();
                        try
                        {
                            completedLessonIds = await _context.LessonCompletions
                                .Where(lc => lc.UserId == userId)
                                .Join(_context.Lessons.Where(l => l.CourseId == courseId),
                                    lc => lc.LessonId,
                                    l => l.Id,
                                    (lc, l) => lc.LessonId)
                                .Distinct()
                                .ToListAsync();
                        }
                        catch
                        {
                            // If join fails, try alternative approach
                            var allCourseLessonIds = await _context.Lessons
                                .Where(l => l.CourseId == courseId)
                                .Select(l => l.Id)
                                .ToListAsync();
                            
                            completedLessonIds = await _context.LessonCompletions
                                .Where(lc => lc.UserId == userId && allCourseLessonIds.Contains(lc.LessonId))
                                .Select(lc => lc.LessonId)
                                .Distinct()
                                .ToListAsync();
                        }
                        var completedLessons = completedLessonIds?.Count ?? 0;

                        // Get completed quizzes (all attempted) and passed quizzes (only passed)
                        // IMPORTANT: A quiz is considered "completed" if the student submitted it (attempted it),
                        // regardless of whether they passed or failed. Failed quizzes still count as completed.
                        var completedQuizIds = new List<int>();
                        var passedQuizIds = new List<int>();
                        try
                        {
                            var allCourseQuizIds = await _context.Quizzes
                                .Where(q => q.CourseId == courseId)
                                .Select(q => q.Id)
                                .ToListAsync();
                            
                            if (allCourseQuizIds.Any())
                            {
                                // For each quiz, get the latest attempt
                                foreach (var quizId in allCourseQuizIds)
                                {
                                    var latestAttempt = await _context.QuizAttempts
                                        .Where(qa => qa.UserId == userId && qa.QuizId == quizId)
                                        .OrderByDescending(qa => qa.AttemptDate)
                                        .FirstOrDefaultAsync();
                                    
                                    // Quiz is completed if any attempt exists (passed OR failed)
                                    // If student submitted the quiz, it counts as completed
                                    if (latestAttempt != null)
                                    {
                                        completedQuizIds.Add(quizId);
                                        
                                        // Quiz is passed only if latest attempt passed
                                        if (latestAttempt.Passed)
                                        {
                                            passedQuizIds.Add(quizId);
                                        }
                                    }
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error checking quiz completion in dashboard: {ex.Message}");
                        }
                        var completedQuizzes = completedQuizIds?.Count ?? 0;
                        var passedQuizzes = passedQuizIds?.Count ?? 0;

                        // Calculate progress percentage - based on lessons AND quizzes
                        // CORRECT FORMULA: Calculate lesson and quiz progress separately, then use weighted average
                        // If all lessons completed AND all quizzes passed → 100%
                        // Otherwise: weighted average (lessons 80%, quizzes 20%) to prioritize lesson completion
                        var progress = 0;
                        if (updatedEnrollment.Status == EnrollmentStatus.Completed)
                        {
                            progress = 100;
                        }
                        else
                        {
                            // Calculate lesson progress (PRIMARY)
                            double lessonProgress = 0;
                            if (totalLessons > 0)
                            {
                                lessonProgress = (double)completedLessons / totalLessons * 100;
                            }
                            else
                            {
                                // If no lessons, consider lesson progress as 100% (nothing to complete)
                                lessonProgress = 100;
                            }

                            // Calculate quiz progress (SECONDARY)
                            double quizProgress = 0;
                            if (totalQuizzes > 0)
                            {
                                quizProgress = (double)passedQuizzes / totalQuizzes * 100;
                            }
                            else
                            {
                                // If no quizzes, consider quiz progress as 100% (nothing to complete)
                                quizProgress = 100;
                            }

                            // If all lessons are completed, progress is 100% (lessons are PRIMARY)
                            if (lessonProgress >= 100)
                            {
                                progress = 100;
                            }
                            else
                            {
                                // Weighted average: lessons 80%, quizzes 20% (lessons are PRIMARY)
                                // If one component doesn't exist, use only the other
                                if (totalLessons == 0 && totalQuizzes > 0)
                                {
                                    progress = (int)Math.Round(quizProgress);
                                }
                                else if (totalQuizzes == 0 && totalLessons > 0)
                                {
                                    progress = (int)Math.Round(lessonProgress);
                                }
                                else
                                {
                                    // Both exist: weighted average (80% lessons, 20% quizzes)
                                    // Example: 15/19 lessons (79%) + 2/6 quizzes (33%) = 79*0.8 + 33*0.2 = 63.2 + 6.6 = 69.8%
                                    progress = (int)Math.Round(lessonProgress * 0.8 + quizProgress * 0.2);
                                }
                                progress = Math.Max(0, Math.Min(100, progress));
                            }
                        }

                        // Get last accessed date - prefer enrollment.LastAccessed, otherwise calculate from activities
                        DateTime? lastAccessed = updatedEnrollment.LastAccessed;

                        if (!lastAccessed.HasValue)
                        {
                            DateTime? lastLessonDate = null;
                            DateTime? lastQuizDate = null;

                            try
                            {
                                lastLessonDate = await _context.LessonCompletions
                                    .Where(lc => lc.UserId == userId)
                                    .Join(_context.Lessons.Where(l => l.CourseId == courseId),
                                        lc => lc.LessonId,
                                        l => l.Id,
                                        (lc, l) => (DateTime?)lc.CompletedDate)
                                    .OrderByDescending(d => d)
                                    .FirstOrDefaultAsync();
                            }
                            catch
                            {
                                // If join fails, try alternative
                                var courseLessonIds = await _context.Lessons
                                    .Where(l => l.CourseId == courseId)
                                    .Select(l => l.Id)
                                    .ToListAsync();
                                
                                lastLessonDate = await _context.LessonCompletions
                                    .Where(lc => lc.UserId == userId && courseLessonIds.Contains(lc.LessonId))
                                    .OrderByDescending(lc => lc.CompletedDate)
                                    .Select(lc => (DateTime?)lc.CompletedDate)
                                    .FirstOrDefaultAsync();
                            }

                            try
                            {
                                lastQuizDate = await _context.QuizAttempts
                                    .Where(qa => qa.UserId == userId)
                                    .Join(_context.Quizzes.Where(q => q.CourseId == courseId),
                                        qa => qa.QuizId,
                                        q => q.Id,
                                        (qa, q) => (DateTime?)qa.AttemptDate)
                                    .OrderByDescending(d => d)
                                    .FirstOrDefaultAsync();
                            }
                            catch
                            {
                                // If join fails, try alternative
                                var courseQuizIds = await _context.Quizzes
                                    .Where(q => q.CourseId == courseId)
                                    .Select(q => q.Id)
                                    .ToListAsync();
                                
                                lastQuizDate = await _context.QuizAttempts
                                    .Where(qa => qa.UserId == userId && courseQuizIds.Contains(qa.QuizId))
                                    .OrderByDescending(qa => qa.AttemptDate)
                                    .Select(qa => (DateTime?)qa.AttemptDate)
                                    .FirstOrDefaultAsync();
                            }

                            if (lastLessonDate.HasValue && lastQuizDate.HasValue)
                            {
                                lastAccessed = lastLessonDate > lastQuizDate ? lastLessonDate : lastQuizDate;
                            }
                            else if (lastLessonDate.HasValue)
                            {
                                lastAccessed = lastLessonDate;
                            }
                            else if (lastQuizDate.HasValue)
                            {
                                lastAccessed = lastQuizDate;
                            }
                        }

                        // Determine next lesson ID (if course is not completed)
                        int? nextLessonId = null;
                        if (updatedEnrollment.Status != EnrollmentStatus.Completed)
                        {
                            try
                            {
                                var allLessons = await _context.Lessons
                                    .Where(l => l.CourseId == courseId)
                                    .OrderBy(l => l.Order)
                                    .ToListAsync();

                                if (allLessons != null && allLessons.Any())
                                {
                                    // Ensure completedLessonIds is never null
                                    var completedLessonIdsSafe = completedLessonIds ?? new List<int>();
                                    var nextLesson = allLessons
                                        .FirstOrDefault(l => !completedLessonIdsSafe.Contains(l.Id));

                                    if (nextLesson != null)
                                    {
                                        nextLessonId = nextLesson.Id;
                                    }
                                }
                            }
                            catch
                            {
                                // If query fails, just leave nextLessonId as null
                            }
                        }

                        // Update summary counts
                        if (updatedEnrollment.Status == EnrollmentStatus.Completed)
                        {
                            completedCourses++;
                        }
                        else if (updatedEnrollment.Status == EnrollmentStatus.InProgress)
                        {
                            inProgressCourses++;
                        }

                        totalCompletionPercentage += progress;

                        // Use updatedEnrollment.Course to ensure we have the latest data
                        var courseForDto = updatedEnrollment.Course;
                        courses.Add(new CourseProgressDto
                        {
                            CourseId = courseForDto.Id,
                            Title = courseForDto.Title ?? string.Empty,
                            Status = updatedEnrollment.Status.ToString(),
                            CompletionPercentage = progress,
                            CompletedLessons = completedLessons,
                            TotalLessons = totalLessons,
                            CompletedQuizzes = completedQuizzes,
                            PassedQuizzes = passedQuizzes,
                            TotalQuizzes = totalQuizzes,
                            LastAccessed = lastAccessed,
                            NextLessonId = nextLessonId
                        });
                    }
                    catch (Exception ex)
                    {
                        // Log error for this enrollment but continue with others
                        Console.WriteLine($"Error processing enrollment {enrollment?.Id} in dashboard: {ex.Message}");
                        Console.WriteLine($"Stack trace: {ex.StackTrace}");
                        continue;
                    }
                }

                // Calculate overall completion percentage (average of all courses)
                // Use courses.Count instead of enrollments.Count to account for skipped enrollments
                // Safe division - check for zero
                var overallProgress = 0.0;
                if (courses != null && courses.Count > 0 && totalCompletionPercentage >= 0)
                {
                    overallProgress = totalCompletionPercentage / courses.Count;
                }

                // Calculate overall lesson stats across all enrolled courses
                int totalLessonsCount = 0;
                int completedLessonsCount = 0;
                DateTime? lastAccessedLessonDate = null;

                // Ensure courses is not null before using it
                var coursesList = courses ?? new List<CourseProgressDto>();

                try
                {
                    // Get all course IDs from successful enrollments
                    var enrolledCourseIds = coursesList.Select(c => c.CourseId).ToList();
                    
                    if (enrolledCourseIds != null && enrolledCourseIds.Any())
                    {
                        // Get total lessons count across all enrolled courses
                        totalLessonsCount = await _context.Lessons
                            .Where(l => enrolledCourseIds.Contains(l.CourseId))
                            .CountAsync();

                        // Get completed lessons count across all enrolled courses
                        // Use safe approach that handles orphaned records
                        try
                        {
                            var completedLessonIdsOverall = await _context.LessonCompletions
                                .Where(lc => lc.UserId == userId)
                                .Join(_context.Lessons.Where(l => enrolledCourseIds.Contains(l.CourseId)),
                                    lc => lc.LessonId,
                                    l => l.Id,
                                    (lc, l) => lc.LessonId)
                                .Distinct()
                                .ToListAsync();
                            completedLessonsCount = completedLessonIdsOverall?.Count ?? 0;
                        }
                        catch
                        {
                            // If join fails, try alternative approach
                            var allEnrolledLessonIds = await _context.Lessons
                                .Where(l => enrolledCourseIds.Contains(l.CourseId))
                                .Select(l => l.Id)
                                .ToListAsync();
                            
                            completedLessonsCount = await _context.LessonCompletions
                                .Where(lc => lc.UserId == userId && allEnrolledLessonIds.Contains(lc.LessonId))
                                .Select(lc => lc.LessonId)
                                .Distinct()
                                .CountAsync();
                        }

                        // Get last accessed lesson date across all enrolled courses
                        try
                        {
                            lastAccessedLessonDate = await _context.LessonCompletions
                                .Where(lc => lc.UserId == userId)
                                .Join(_context.Lessons.Where(l => enrolledCourseIds.Contains(l.CourseId)),
                                    lc => lc.LessonId,
                                    l => l.Id,
                                    (lc, l) => (DateTime?)lc.CompletedDate)
                                .OrderByDescending(d => d)
                                .FirstOrDefaultAsync();
                        }
                        catch
                        {
                            // If join fails, try alternative
                            var allEnrolledLessonIds = await _context.Lessons
                                .Where(l => enrolledCourseIds.Contains(l.CourseId))
                                .Select(l => l.Id)
                                .ToListAsync();
                            
                            lastAccessedLessonDate = await _context.LessonCompletions
                                .Where(lc => lc.UserId == userId && allEnrolledLessonIds.Contains(lc.LessonId))
                                .OrderByDescending(lc => lc.CompletedDate)
                                .Select(lc => (DateTime?)lc.CompletedDate)
                                .FirstOrDefaultAsync();
                        }
                    }
                }
                catch (Exception ex)
                {
                    // Log error but continue - overall stats failure shouldn't break the dashboard
                    Console.WriteLine($"Error calculating overall lesson stats: {ex.Message}");
                    // Use defaults (already set to 0 and null)
                }

                // Return flat object structure as per requirements
                // coursesList is already declared above
                var dashboard = new
                {
                    totalCourses = coursesList.Count,
                    completedCourses = completedCourses,
                    inProgressCourses = inProgressCourses,
                    totalLessons = totalLessonsCount,
                    completedLessons = completedLessonsCount,
                    overallProgress = Math.Round(overallProgress, 2),
                    lastAccessedLessonDate = lastAccessedLessonDate,
                    courses = coursesList.Select(c => new
                    {
                        courseId = c.CourseId,
                        title = c.Title ?? string.Empty,
                        status = c.Status ?? string.Empty,
                        progress = c.CompletionPercentage,
                        completedLessons = c.CompletedLessons,
                        totalLessons = c.TotalLessons,
                        passedQuizzes = c.PassedQuizzes,
                        totalQuizzes = c.TotalQuizzes,
                        lastAccessed = c.LastAccessed
                    }).ToList()
                };

                return Ok(dashboard);
            }
            catch (Exception ex)
            {
                // Log the error with full details
                Console.WriteLine($"Error in GetDashboard: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                
                // Return empty dashboard instead of error to prevent UI showing retry
                // This ensures the UI always gets valid data structure
                return Ok(new
                {
                    totalCourses = 0,
                    completedCourses = 0,
                    inProgressCourses = 0,
                    totalLessons = 0,
                    completedLessons = 0,
                    overallProgress = 0.0,
                    lastAccessedLessonDate = (DateTime?)null,
                    courses = new List<object>()
                });
            }
        }

        [HttpGet("enrollments")]
        [Authorize(Roles = "Student")]
        public async Task<ActionResult<IEnumerable<object>>> GetMyEnrollments()
        {
            // Get logged-in userId from JWT claims
            var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(sub, out var userId))
            {
                return Unauthorized("Invalid user token");
            }

            var enrollments = await _context.Enrollments
                .Where(e => e.UserId == userId)
                .Select(e => new
                {
                    id = e.Id,
                    courseId = e.CourseId,
                    userId = e.UserId,
                    enrolledAt = e.EnrolledAt
                })
                .ToListAsync();

            return Ok(enrollments);
        }



        [HttpGet("courses")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetMyCourses()
        {
            try
            {
                // Get logged-in userId from JWT claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                // Get all enrollments for the user
                // Join with Courses to ensure only enrollments with valid courses are returned
                // This prevents null reference errors if a course was deleted but enrollment still exists
                var enrollments = await _context.Enrollments
                    .Where(e => e.UserId == userId)
                    .Join(_context.Courses,
                        enrollment => enrollment.CourseId,
                        course => course.Id,
                        (enrollment, course) => enrollment)
                    .Include(e => e.Course)
                        .ThenInclude(c => c.Creator)
                    .ToListAsync();

                // If no enrollments, return empty list (NOT error)
                if (enrollments == null || enrollments.Count == 0)
                {
                    return Ok(new List<object>());
                }

                var coursesWithStats = new List<object>();

                foreach (var enrollment in enrollments ?? new List<Enrollment>())
                {
                    try
                    {
                        // Skip if enrollment or course is null (defensive check)
                        if (enrollment == null || enrollment.Course == null)
                        {
                            continue;
                        }

                        // Safely get courseId - already checked Course is not null above
                        var courseId = enrollment.Course?.Id ?? 0;
                        if (courseId == 0)
                        {
                            continue; // Skip if courseId is invalid
                        }
                        
                        // Check and update course completion status before calculating stats
                        // Wrap in try-catch to handle any errors in completion check
                        try
                        {
                            await CheckAndUpdateCourseCompletion(userId, courseId);
                        }
                        catch (Exception ex)
                        {
                            // Log but continue - completion check failure shouldn't break the courses list
                            Console.WriteLine($"Error checking course completion for course {courseId}: {ex.Message}");
                        }
                        
                        // Re-fetch enrollment to get updated status (safer than ReloadAsync)
                        // Include Course and Creator to ensure it's available, and filter to ensure Course exists
                        var updatedEnrollment = await _context.Enrollments
                            .Include(e => e.Course)
                                .ThenInclude(c => c.Creator)
                            .Where(e => e.Id == enrollment.Id && e.Course != null)
                            .FirstOrDefaultAsync();
                        
                        if (updatedEnrollment == null || updatedEnrollment.Course == null)
                        {
                            continue;
                        }
                        
                        // Double-check courseId is still valid
                        var validCourseId = updatedEnrollment.Course?.Id ?? 0;
                        if (validCourseId == 0 || validCourseId != courseId)
                        {
                            continue; // Skip if courseId is invalid or changed
                        }
                
                        // Get total counts - safe even if no lessons/quizzes exist
                        var totalLessons = await _context.Lessons
                            .Where(l => l.CourseId == courseId)
                            .CountAsync();
                        var totalQuizzes = await _context.Quizzes
                            .Where(q => q.CourseId == courseId)
                            .CountAsync();

                        // Get completed lessons (distinct lesson IDs completed by this user in this course)
                        // Use safe join that handles orphaned records
                        var completedLessonIds = new List<int>();
                        try
                        {
                            completedLessonIds = await _context.LessonCompletions
                                .Where(lc => lc.UserId == userId)
                                .Join(_context.Lessons.Where(l => l.CourseId == courseId),
                                    lc => lc.LessonId,
                                    l => l.Id,
                                    (lc, l) => lc.LessonId)
                                .Distinct()
                                .ToListAsync();
                        }
                        catch
                        {
                            // If join fails, try alternative approach
                            var allCourseLessonIds = await _context.Lessons
                                .Where(l => l.CourseId == courseId)
                                .Select(l => l.Id)
                                .ToListAsync();
                            
                            completedLessonIds = await _context.LessonCompletions
                                .Where(lc => lc.UserId == userId && allCourseLessonIds.Contains(lc.LessonId))
                                .Select(lc => lc.LessonId)
                                .Distinct()
                                .ToListAsync();
                        }
                        var completedLessons = completedLessonIds?.Count ?? 0;

                        // Get completed quizzes (all attempted) and passed quizzes (only passed)
                        // IMPORTANT: A quiz is considered "completed" if the student submitted it (attempted it),
                        // regardless of whether they passed or failed. Failed quizzes still count as completed.
                        var completedQuizIds = new List<int>();
                        var passedQuizIds = new List<int>();
                        try
                        {
                            var allCourseQuizIds = await _context.Quizzes
                                .Where(q => q.CourseId == courseId)
                                .Select(q => q.Id)
                                .ToListAsync();
                            
                            if (allCourseQuizIds.Any())
                            {
                                // For each quiz, get the latest attempt
                                foreach (var quizId in allCourseQuizIds)
                                {
                                    var latestAttempt = await _context.QuizAttempts
                                        .Where(qa => qa.UserId == userId && qa.QuizId == quizId)
                                        .OrderByDescending(qa => qa.AttemptDate)
                                        .FirstOrDefaultAsync();
                                    
                                    // Quiz is completed if any attempt exists (passed OR failed)
                                    // If student submitted the quiz, it counts as completed
                                    if (latestAttempt != null)
                                    {
                                        completedQuizIds.Add(quizId);
                                        
                                        // Quiz is passed only if latest attempt passed
                                        if (latestAttempt.Passed)
                                        {
                                            passedQuizIds.Add(quizId);
                                        }
                                    }
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error checking quiz completion in GetMyCourses: {ex.Message}");
                        }
                        var completedQuizzes = completedQuizIds?.Count ?? 0;
                        var passedQuizzes = passedQuizIds?.Count ?? 0;

                        // Calculate progress percentage - based on lessons AND quizzes
                        // CORRECT FORMULA: Calculate lesson and quiz progress separately, then use weighted average
                        // If all lessons completed AND all quizzes passed → 100%
                        // Otherwise: weighted average (lessons 80%, quizzes 20%) to prioritize lesson completion
                        var progress = 0;
                        if (updatedEnrollment.Status == EnrollmentStatus.Completed)
                        {
                            progress = 100;
                        }
                        else
                        {
                            // Calculate lesson progress (PRIMARY)
                            double lessonProgress = 0;
                            if (totalLessons > 0)
                            {
                                lessonProgress = (double)completedLessons / totalLessons * 100;
                            }
                            else
                            {
                                // If no lessons, consider lesson progress as 100% (nothing to complete)
                                lessonProgress = 100;
                            }

                            // Calculate quiz progress (SECONDARY)
                            double quizProgress = 0;
                            if (totalQuizzes > 0)
                            {
                                quizProgress = (double)passedQuizzes / totalQuizzes * 100;
                            }
                            else
                            {
                                // If no quizzes, consider quiz progress as 100% (nothing to complete)
                                quizProgress = 100;
                            }

                            // If all lessons are completed, progress is 100% (lessons are PRIMARY)
                            if (lessonProgress >= 100)
                            {
                                progress = 100;
                            }
                            else
                            {
                                // Weighted average: lessons 80%, quizzes 20% (lessons are PRIMARY)
                                // If one component doesn't exist, use only the other
                                if (totalLessons == 0 && totalQuizzes > 0)
                                {
                                    progress = (int)Math.Round(quizProgress);
                                }
                                else if (totalQuizzes == 0 && totalLessons > 0)
                                {
                                    progress = (int)Math.Round(lessonProgress);
                                }
                                else
                                {
                                    // Both exist: weighted average (80% lessons, 20% quizzes)
                                    // Example: 15/19 lessons (79%) + 2/6 quizzes (33%) = 79*0.8 + 33*0.2 = 63.2 + 6.6 = 69.8%
                                    progress = (int)Math.Round(lessonProgress * 0.8 + quizProgress * 0.2);
                                }
                                progress = Math.Max(0, Math.Min(100, progress));
                            }
                        }

                        // Get last accessed date - prefer enrollment.LastAccessed, otherwise calculate from activities
                        DateTime? lastAccessed = updatedEnrollment.LastAccessed;

                        if (!lastAccessed.HasValue)
                        {
                            DateTime? lastLessonDate = null;
                            DateTime? lastQuizDate = null;

                            try
                            {
                                lastLessonDate = await _context.LessonCompletions
                                    .Where(lc => lc.UserId == userId)
                                    .Join(_context.Lessons.Where(l => l.CourseId == courseId),
                                        lc => lc.LessonId,
                                        l => l.Id,
                                        (lc, l) => (DateTime?)lc.CompletedDate)
                                    .OrderByDescending(d => d)
                                    .FirstOrDefaultAsync();
                            }
                            catch
                            {
                                // If join fails, try alternative
                                var courseLessonIds = await _context.Lessons
                                    .Where(l => l.CourseId == courseId)
                                    .Select(l => l.Id)
                                    .ToListAsync();
                                
                                lastLessonDate = await _context.LessonCompletions
                                    .Where(lc => lc.UserId == userId && courseLessonIds.Contains(lc.LessonId))
                                    .OrderByDescending(lc => lc.CompletedDate)
                                    .Select(lc => (DateTime?)lc.CompletedDate)
                                    .FirstOrDefaultAsync();
                            }

                            try
                            {
                                lastQuizDate = await _context.QuizAttempts
                                    .Where(qa => qa.UserId == userId)
                                    .Join(_context.Quizzes.Where(q => q.CourseId == courseId),
                                        qa => qa.QuizId,
                                        q => q.Id,
                                        (qa, q) => (DateTime?)qa.AttemptDate)
                                    .OrderByDescending(d => d)
                                    .FirstOrDefaultAsync();
                            }
                            catch
                            {
                                // If join fails, try alternative
                                var courseQuizIds = await _context.Quizzes
                                    .Where(q => q.CourseId == courseId)
                                    .Select(q => q.Id)
                                    .ToListAsync();
                                
                                lastQuizDate = await _context.QuizAttempts
                                    .Where(qa => qa.UserId == userId && courseQuizIds.Contains(qa.QuizId))
                                    .OrderByDescending(qa => qa.AttemptDate)
                                    .Select(qa => (DateTime?)qa.AttemptDate)
                                    .FirstOrDefaultAsync();
                            }

                            if (lastLessonDate.HasValue && lastQuizDate.HasValue)
                            {
                                lastAccessed = lastLessonDate > lastQuizDate ? lastLessonDate : lastQuizDate;
                            }
                            else if (lastLessonDate.HasValue)
                            {
                                lastAccessed = lastLessonDate;
                            }
                            else if (lastQuizDate.HasValue)
                            {
                                lastAccessed = lastQuizDate;
                            }
                        }

                        // Use updatedEnrollment.Course to ensure we have the latest data
                        // Additional null check before accessing Course properties
                        var courseForDto = updatedEnrollment.Course;
                        if (courseForDto == null)
                        {
                            continue; // Skip if Course is null
                        }
                        
                        coursesWithStats.Add(new
                        {
                            courseId = courseForDto.Id,
                            id = courseForDto.Id, // Add id field for frontend compatibility
                            title = courseForDto.Title ?? string.Empty,
                            shortDescription = courseForDto.ShortDescription ?? string.Empty,
                            instructor = courseForDto.Creator != null ? courseForDto.Creator.FullName ?? string.Empty : string.Empty,
                            status = updatedEnrollment.Status.ToString(),
                            progress = progress,
                            lessonsCount = totalLessons,
                            completedLessonsCount = completedLessons,
                            quizzesCount = totalQuizzes,
                            completedQuizzesCount = completedQuizzes,
                            passedQuizzesCount = passedQuizzes,
                            lastAccessed = lastAccessed
                        });
                    }
                    catch (Exception ex)
                    {
                        // Log error for this enrollment but continue with others
                        Console.WriteLine($"Error processing enrollment {enrollment?.Id}: {ex.Message}");
                        Console.WriteLine($"Stack trace: {ex.StackTrace}");
                        continue;
                    }
                }

                // Ensure we always return a valid array, never null
                var result = coursesWithStats ?? new List<object>();
                return Ok(result);
            }
            catch (Exception ex)
            {
                // Log the error with full details
                Console.WriteLine($"Error in GetMyCourses: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                
                // Return empty array instead of error to prevent UI showing error
                // This ensures the UI always gets valid data structure
                return Ok(new List<object>());
            }
        }

        [HttpGet("courses/{courseId}")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetCourseDetails(int courseId)
        {
            // Get logged-in userId from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            // Check if student is enrolled in this course
            var enrollment = await _context.Enrollments
                .Where(e => e.UserId == userId && e.CourseId == courseId)
                .Include(e => e.Course)
                .FirstOrDefaultAsync();

            if (enrollment == null || enrollment.Course == null)
            {
                return NotFound(new { message = "Course not found or you are not enrolled" });
            }

            // Check and update course completion status before calculating stats
            await CheckAndUpdateCourseCompletion(userId, courseId);
            
            // Re-fetch enrollment to get updated status (safer than ReloadAsync)
            var updatedEnrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.Id == enrollment.Id);
            
            if (updatedEnrollment == null)
            {
                return NotFound(new { message = "Enrollment not found" });
            }

            // Get all lessons for this course (ordered)
            var lessons = await _context.Lessons
                .Where(l => l.CourseId == courseId)
                .OrderBy(l => l.Order)
                .ToListAsync();

            // Get completed lesson IDs for this user in this course
            var completedLessonIds = new List<int>();
            try
            {
                completedLessonIds = await _context.LessonCompletions
                    .Where(lc => lc.UserId == userId)
                    .Join(_context.Lessons.Where(l => l.CourseId == courseId),
                        lc => lc.LessonId,
                        l => l.Id,
                        (lc, l) => lc.LessonId)
                    .Distinct()
                    .ToListAsync();
            }
            catch
            {
                // If join fails, try alternative approach
                var allCourseLessonIds = lessons.Select(l => l.Id).ToList();
                completedLessonIds = await _context.LessonCompletions
                    .Where(lc => lc.UserId == userId && allCourseLessonIds.Contains(lc.LessonId))
                    .Select(lc => lc.LessonId)
                    .Distinct()
                    .ToListAsync();
            }

            // Get all quizzes for this course
            var quizzes = await _context.Quizzes
                .Where(q => q.CourseId == courseId)
                .ToListAsync();

            // Get completed quizzes (all attempted) and passed quizzes (only passed)
            var completedQuizIds = new List<int>();
            var passedQuizIds = new List<int>();
            try
            {
                var allCourseQuizIds = quizzes.Select(q => q.Id).ToList();
                
                if (allCourseQuizIds.Any())
                {
                    // For each quiz, get the latest attempt
                    foreach (var quizId in allCourseQuizIds)
                    {
                        var latestAttempt = await _context.QuizAttempts
                            .Where(qa => qa.UserId == userId && qa.QuizId == quizId)
                            .OrderByDescending(qa => qa.AttemptDate)
                            .FirstOrDefaultAsync();
                        
                        // Quiz is completed if any attempt exists
                        if (latestAttempt != null)
                        {
                            completedQuizIds.Add(quizId);
                            
                            // Quiz is passed if latest attempt passed
                            if (latestAttempt.Passed)
                            {
                                passedQuizIds.Add(quizId);
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error checking quiz completion in GetCourseDetails: {ex.Message}");
            }

            // Calculate progress stats
            var totalLessons = lessons?.Count ?? 0;
            var completedLessons = completedLessonIds?.Count ?? 0;
            var totalQuizzes = quizzes?.Count ?? 0;
            var completedQuizzes = completedQuizIds?.Count ?? 0;
            var passedQuizzes = passedQuizIds?.Count ?? 0;

            // Calculate progress percentage - based on lessons AND quizzes
            // CORRECT FORMULA: Calculate lesson and quiz progress separately, then use weighted average
            // If all lessons completed AND all quizzes passed → 100%
            // Otherwise: weighted average (lessons 80%, quizzes 20%) to prioritize lesson completion
            var progress = 0;
            if (updatedEnrollment.Status == EnrollmentStatus.Completed)
            {
                progress = 100;
            }
            else
            {
                // Calculate lesson progress (PRIMARY)
                double lessonProgress = 0;
                if (totalLessons > 0)
                {
                    lessonProgress = (double)completedLessons / totalLessons * 100;
                }
                else
                {
                    // If no lessons, consider lesson progress as 100% (nothing to complete)
                    lessonProgress = 100;
                }

                // Calculate quiz progress (SECONDARY)
                double quizProgress = 0;
                if (totalQuizzes > 0)
                {
                    quizProgress = (double)passedQuizzes / totalQuizzes * 100;
                }
                else
                {
                    // If no quizzes, consider quiz progress as 100% (nothing to complete)
                    quizProgress = 100;
                }

                // If all lessons are completed, progress is 100% (lessons are PRIMARY)
                if (lessonProgress >= 100)
                {
                    progress = 100;
                }
                else
                {
                    // Weighted average: lessons 80%, quizzes 20% (lessons are PRIMARY)
                    // If one component doesn't exist, use only the other
                    if (totalLessons == 0 && totalQuizzes > 0)
                    {
                        progress = (int)Math.Round(quizProgress);
                    }
                    else if (totalQuizzes == 0 && totalLessons > 0)
                    {
                        progress = (int)Math.Round(lessonProgress);
                    }
                    else
                    {
                        // Both exist: weighted average (80% lessons, 20% quizzes)
                        // Example: 15/19 lessons (79%) + 2/6 quizzes (33%) = 79*0.8 + 33*0.2 = 63.2 + 6.6 = 69.8%
                        progress = (int)Math.Round(lessonProgress * 0.8 + quizProgress * 0.2);
                    }
                    progress = Math.Max(0, Math.Min(100, progress));
                }
            }

            // Build lessons array with completion status (always return array, never null)
            var completedLessonIdsSafe = completedLessonIds ?? new List<int>();
            var lessonsArray = (lessons != null && lessons.Any() ? lessons : new List<Lesson>()).Select(l => new
            {
                id = l.Id,
                title = l.Title ?? string.Empty,
                content = l.Content ?? string.Empty,
                videoUrl = l.VideoUrl ?? string.Empty,
                order = l.Order,
                estimatedDuration = l.EstimatedDuration,
                isCompleted = completedLessonIdsSafe.Contains(l.Id)
            }).ToList();

            // Build quizzes array with pass status (always return array, never null)
            var passedQuizIdsSafe = passedQuizIds ?? new List<int>();
            var quizzesArray = (quizzes != null && quizzes.Any() ? quizzes : new List<Quiz>()).Select(q => new
            {
                id = q.Id,
                title = q.Title ?? string.Empty,
                passingScore = q.PassingScore,
                timeLimit = q.TimeLimit,
                isPassed = passedQuizIdsSafe.Contains(q.Id)
            }).ToList();

            var courseData = new
            {
                course = new
                {
                    id = enrollment.Course.Id,
                    title = enrollment.Course.Title ?? string.Empty,
                    shortDescription = enrollment.Course.ShortDescription ?? string.Empty,
                    longDescription = enrollment.Course.LongDescription ?? string.Empty,
                    category = enrollment.Course.Category ?? string.Empty,
                    difficulty = enrollment.Course.Difficulty ?? string.Empty,
                    thumbnail = enrollment.Course.Thumbnail ?? string.Empty
                },
                enrollment = new
                {
                    enrolledAt = enrollment.EnrolledAt,
                    status = updatedEnrollment.Status.ToString(),
                    startedAt = updatedEnrollment.StartedAt,
                    completedAt = updatedEnrollment.CompletedAt,
                    lastAccessed = updatedEnrollment.LastAccessed
                },
                progress = new
                {
                    progress = progress,
                    completedLessons = completedLessons,
                    totalLessons = totalLessons,
                    completedQuizzes = completedQuizzes,
                    passedQuizzes = passedQuizzes,
                    totalQuizzes = totalQuizzes
                },
                lessons = lessonsArray,
                quizzes = quizzesArray
            };

            return Ok(courseData);
        }

        [HttpPost("enroll/{courseId}")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> EnrollInCourse(int courseId)
        {
            // Get logged-in userId from JWT claims
            var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(sub, out var userId))
            {
                return Unauthorized("Invalid user token");
            }

            // Check if course exists and is published
            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.Id == courseId && c.IsPublished);

            if (course == null)
            {
                return NotFound(new { message = "Course not found" });
            }

            // Check if student already enrolled
            bool alreadyEnrolled = await _context.Enrollments
                .AnyAsync(e => e.UserId == userId && e.CourseId == courseId);

            if (alreadyEnrolled)
            {
                return Conflict(new { message = "Already enrolled" });
            }

            // Insert enrollment
            var enrollment = new Enrollment
            {
                UserId = userId,
                CourseId = courseId,
                EnrolledAt = DateTime.UtcNow,
                Status = EnrollmentStatus.NotStarted
            };

            _context.Enrollments.Add(enrollment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Enrollment successful" });
        }

        [HttpPost("courses/{courseId}/start")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> StartCourse(int courseId)
        {
            // Get logged-in userId from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            // Find enrollment for this student and course
            var enrollment = await _context.Enrollments
                .Include(e => e.Course)
                .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);

            if (enrollment == null)
            {
                return NotFound(new { message = "Course not found or you are not enrolled" });
            }

            // Verify enrollment is not already started
            if (enrollment.Status != EnrollmentStatus.NotStarted)
            {
                return BadRequest(new { message = "Course has already been started" });
            }

            // Update enrollment status to InProgress
            enrollment.Status = EnrollmentStatus.InProgress;
            enrollment.StartedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Return updated enrollment state
            var response = new
            {
                message = "Course started successfully",
                enrollment = new
                {
                    id = enrollment.Id,
                    courseId = enrollment.CourseId,
                    status = enrollment.Status.ToString(),
                    startedAt = enrollment.StartedAt,
                    enrolledAt = enrollment.EnrolledAt
                }
            };

            return Ok(response);
        }

        [HttpGet("courses/{courseId}/lessons")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetCourseLessons(int courseId, [FromQuery] int? lesson = null)
        {
            try
            {
                // Get logged-in userId from JWT claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                // Validate student enrollment in course (Enrollments table)
                var enrollment = await _context.Enrollments
                    .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);

                if (enrollment == null)
                {
                    return NotFound(new { message = "Course not found or you are not enrolled" });
                }

                // Query: Lessons WHERE CourseId = {courseId} ORDER BY [Order]
                // NO filters by userId, NO join with LessonCompletions for visibility, NO IsPublished filter
                var lessons = await _context.Lessons
                    .Where(l => l.CourseId == courseId)
                    .OrderBy(l => l.Order)
                    .ThenBy(l => l.Id) // Secondary sort by Id for consistent ordering
                    .ToListAsync();

                // Log for debugging
                Console.WriteLine($"Found {lessons.Count} lessons for CourseId {courseId}");
                if (lessons.Count > 0)
                {
                    Console.WriteLine($"Lesson IDs: {string.Join(", ", lessons.Select(l => l.Id))}");
                    Console.WriteLine($"Lesson Titles: {string.Join(", ", lessons.Select(l => l.Title ?? "NULL"))}");
                }

                // Completion data: LEFT JOIN LessonCompletions by (LessonId + UserId)
                // Used only to mark completed lessons in UI, NOT for filtering visibility
                var completedLessonIds = new List<int>();
                try
                {
                    completedLessonIds = await _context.LessonCompletions
                        .Where(lc => lc.UserId == userId)
                        .Select(lc => lc.LessonId)
                        .ToListAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error fetching completions: {ex.Message}");
                    // Continue with empty list if completions query fails
                }

                // Get video progress for all lessons (LEFT JOIN equivalent)
                var videoProgressDict = new Dictionary<int, int>();
                try
                {
                    var videoProgresses = await _context.LessonVideoProgresses
                        .Where(vp => vp.UserId == userId)
                        .Select(vp => new { vp.LessonId, vp.LastWatchedSeconds })
                        .ToListAsync();
                    
                    videoProgressDict = videoProgresses.ToDictionary(x => x.LessonId, x => x.LastWatchedSeconds);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error fetching video progress: {ex.Message}");
                    // Continue with empty dictionary if progress query fails
                }

                // Build response - all lessons for CourseId, with completion status as metadata
                var lessonsArray = lessons.Select(l => new
                {
                    id = l.Id,
                    courseId = l.CourseId,
                    title = l.Title ?? string.Empty,
                    content = l.Content ?? string.Empty,
                    videoUrl = l.VideoUrl ?? string.Empty,
                    order = l.Order,
                    estimatedDuration = l.EstimatedDuration,
                    createdAt = l.CreatedAt,
                    isCompleted = completedLessonIds.Contains(l.Id),
                    lastWatchedSeconds = videoProgressDict.ContainsKey(l.Id) ? videoProgressDict[l.Id] : 0
                }).OrderBy(l => l.order).ToList();

                Console.WriteLine($"Returning {lessonsArray.Count} lessons in response");

                // Determine currentLessonId: use provided lesson param if valid, otherwise first lesson, otherwise null
                int? currentLessonId = null;
                if (lesson.HasValue)
                {
                    // Validate that the lesson belongs to this course
                    var lessonExists = lessonsArray.Any(l => l.id == lesson.Value);
                    if (lessonExists)
                    {
                        currentLessonId = lesson.Value;
                    }
                }
                else if (lessonsArray.Any())
                {
                    // Auto-select first lesson by order if no lesson specified
                    currentLessonId = lessonsArray.First().id;
                }

                // Return response matching frontend expectations - always return object with lessons array
                // lessonsArray is never null (ToList() returns empty list if no items)
                var response = new
                {
                    courseId = courseId,
                    lessons = lessonsArray,
                    currentLessonId = currentLessonId
                };

                Console.WriteLine($"Final response: courseId={response.courseId}, lessons count={response.lessons.Count}, currentLessonId={response.currentLessonId}");
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                // Log the error with full details
                Console.WriteLine($"Error in GetCourseLessons for course {courseId}: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                
                // Return empty response with correct structure instead of error to prevent UI showing retry
                return Ok(new
                {
                    courseId = courseId,
                    lessons = new List<object>(),
                    currentLessonId = (int?)null
                });
            }
        }

        [HttpPost("lessons/{lessonId}/complete")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> CompleteLesson(int lessonId)
        {
            // Get logged-in userId from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            // Verify lesson exists
            var lesson = await _context.Lessons
                .Include(l => l.Course)
                .FirstOrDefaultAsync(l => l.Id == lessonId);

            if (lesson == null)
            {
                return NotFound(new { message = "Lesson not found" });
            }

            // Verify student is enrolled in the course that contains this lesson
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == lesson.CourseId);

            if (enrollment == null)
            {
                return Forbid("You must be enrolled in this course to complete lessons");
            }

            // Check if lesson is already completed - prevent duplicates (same user + lesson)
            var existingCompletion = await _context.LessonCompletions
                .FirstOrDefaultAsync(lc => lc.UserId == userId && lc.LessonId == lessonId);

            if (existingCompletion != null)
            {
                // Return Conflict to indicate duplicate - frontend should handle this gracefully
                return Conflict(new { message = "Lesson already completed" });
            }

            // Create lesson completion record
            var completion = new LessonCompletion
            {
                UserId = userId,
                LessonId = lessonId,
                CompletedDate = DateTime.UtcNow
            };

            _context.LessonCompletions.Add(completion);
            await _context.SaveChangesAsync();

            // Update enrollment LastAccessed
            enrollment.LastAccessed = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Check and update course completion status
            await CheckAndUpdateCourseCompletion(userId, lesson.CourseId);

            return Ok(new
            {
                message = "Lesson completed successfully",
                completion = new
                {
                    id = completion.Id,
                    lessonId = completion.LessonId,
                    userId = completion.UserId,
                    completedDate = completion.CompletedDate
                }
            });
        }

        [HttpPost("lessons/{lessonId}/video-progress")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> SaveVideoProgress(int lessonId, SaveVideoProgressDto dto)
        {
            // Get logged-in userId from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            // Validate input
            if (dto.LastWatchedSeconds < 0)
            {
                return BadRequest(new { message = "LastWatchedSeconds must be non-negative" });
            }

            // Verify lesson exists
            var lesson = await _context.Lessons
                .Include(l => l.Course)
                .FirstOrDefaultAsync(l => l.Id == lessonId);

            if (lesson == null)
            {
                return NotFound(new { message = "Lesson not found" });
            }

            // Verify student is enrolled in the course that contains this lesson
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == lesson.CourseId);

            if (enrollment == null)
            {
                return Forbid("You must be enrolled in this course to save video progress");
            }

            // Find existing progress or create new
            var existingProgress = await _context.LessonVideoProgresses
                .FirstOrDefaultAsync(vp => vp.UserId == userId && vp.LessonId == lessonId);

            if (existingProgress != null)
            {
                // Update existing progress
                existingProgress.LastWatchedSeconds = dto.LastWatchedSeconds;
                existingProgress.LastUpdatedAt = DateTime.UtcNow;
            }
            else
            {
                // Create new progress record
                var newProgress = new LessonVideoProgress
                {
                    UserId = userId,
                    LessonId = lessonId,
                    LastWatchedSeconds = dto.LastWatchedSeconds,
                    LastUpdatedAt = DateTime.UtcNow
                };
                _context.LessonVideoProgresses.Add(newProgress);
            }

            // Update enrollment LastAccessed
            enrollment.LastAccessed = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Video progress saved successfully",
                lastWatchedSeconds = dto.LastWatchedSeconds
            });
        }

        [HttpGet("quizzes/{quizId}")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetQuizForAttempt(int quizId)
        {
            // Get logged-in userId from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            // Get quiz with questions and answers
            var quiz = await _context.Quizzes
                .Include(q => q.Questions)
                    .ThenInclude(q => q.Answers)
                .Include(q => q.Course)
                .FirstOrDefaultAsync(q => q.Id == quizId);

            if (quiz == null)
            {
                return NotFound(new { message = "Quiz not found" });
            }

            // Verify student is enrolled in the course
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == quiz.CourseId);

            if (enrollment == null)
            {
                return Forbid("You must be enrolled in this course to take the quiz");
            }

            // Load questions first
            var questions = await _context.Questions
                .Where(q => q.QuizId == quizId)
                .ToListAsync();

            // ALWAYS load answers separately to ensure they're included
            // This is more reliable than relying on Include() navigation properties
            var questionIds = questions.Select(q => q.Id).ToList();
            var allAnswers = new List<Answer>();
            
            if (questionIds.Any())
            {
                allAnswers = await _context.Answers
                    .Where(a => questionIds.Contains(a.QuestionId))
                    .ToListAsync();
            }

            // Build response with questions and their answers
            var questionsWithAnswers = questions.Select(q => new
            {
                id = q.Id,
                questionText = q.QuestionText ?? string.Empty,
                questionType = q.QuestionType ?? "MCQ",
                answers = allAnswers
                    .Where(a => a.QuestionId == q.Id && a != null)
                    .Select(a => new
                    {
                        id = a.Id,
                        answerText = !string.IsNullOrWhiteSpace(a.AnswerText) ? a.AnswerText : string.Empty
                        // Note: IsCorrect is NOT included - students shouldn't see correct answers
                    })
                    .Where(a => !string.IsNullOrWhiteSpace(a.answerText)) // Only include answers with text
                    .ToList()
            }).ToList();

            // Return quiz with questions (but hide correct answers)
            var quizData = new
            {
                id = quiz.Id,
                title = quiz.Title,
                courseId = quiz.CourseId,
                passingScore = quiz.PassingScore,
                timeLimit = quiz.TimeLimit,
                questions = questionsWithAnswers
            };

            return Ok(quizData);
        }

        [HttpPost("quizzes/{quizId}/attempt")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> SubmitQuizAttempt(int quizId, SubmitQuizAttemptDto dto)
        {
            // Get logged-in userId from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            // Verify quiz exists
            var quiz = await _context.Quizzes
                .Include(q => q.Questions)
                    .ThenInclude(q => q.Answers)
                .Include(q => q.Course)
                .FirstOrDefaultAsync(q => q.Id == quizId);

            if (quiz == null)
            {
                return NotFound(new { message = "Quiz not found" });
            }

            // Verify student is enrolled in the course
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == quiz.CourseId);

            if (enrollment == null)
            {
                return Forbid("You must be enrolled in this course to take the quiz");
            }

            // Calculate score based on submitted answers
            int correctAnswers = 0;
            int totalQuestions = quiz.Questions.Count;

            foreach (var question in quiz.Questions)
            {
                var submittedAnswer = dto.Answers.FirstOrDefault(a => a.QuestionId == question.Id);
                
                if (submittedAnswer == null)
                {
                    // No answer submitted for this question - counts as incorrect
                    continue;
                }

                var correctAnswerIds = question.Answers
                    .Where(a => a.IsCorrect)
                    .Select(a => a.Id)
                    .OrderBy(id => id)
                    .ToList();

                var submittedAnswerIds = submittedAnswer.SelectedAnswerIds
                    .OrderBy(id => id)
                    .ToList();

                // Check if submitted answers match correct answers exactly
                if (correctAnswerIds.Count == submittedAnswerIds.Count &&
                    correctAnswerIds.SequenceEqual(submittedAnswerIds))
                {
                    correctAnswers++;
                }
            }

            // Calculate score as percentage
            int score = totalQuestions > 0 
                ? (int)Math.Round((double)correctAnswers / totalQuestions * 100) 
                : 0;

            // Determine pass/fail
            bool passed = score >= quiz.PassingScore;

            // Create quiz attempt record
            var attempt = new QuizAttempt
            {
                QuizId = quizId,
                UserId = userId,
                Score = score,
                Passed = passed,
                AttemptDate = DateTime.UtcNow
            };

            _context.QuizAttempts.Add(attempt);

            // Update enrollment LastAccessed
            enrollment.LastAccessed = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // ALWAYS check and update course completion status after quiz submission
            // This ensures course status is correct even if student fails a previously passed quiz
            await CheckAndUpdateCourseCompletion(userId, quiz.CourseId);

            // Return result summary
            var result = new QuizAttemptResultDto
            {
                AttemptId = attempt.Id,
                QuizId = quizId,
                Score = score,
                TotalQuestions = totalQuestions,
                PassingScore = quiz.PassingScore,
                Passed = passed,
                AttemptDate = attempt.AttemptDate
            };

            return Ok(result);
        }

        [HttpGet("courses/{courseId}/continue")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> ContinueLearning(int courseId)
        {
            // Get logged-in userId from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            // Verify enrollment exists for this course
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);

            if (enrollment == null)
            {
                return NotFound(new { message = "Course not found or you are not enrolled" });
            }

            // Check and update course completion status before determining next lesson
            await CheckAndUpdateCourseCompletion(userId, courseId);
            
            // Re-fetch enrollment to get updated status (safer than ReloadAsync)
            var updatedEnrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.Id == enrollment.Id);
            
            if (updatedEnrollment == null)
            {
                return NotFound(new { message = "Enrollment not found" });
            }

            // If course is completed, return early
            if (updatedEnrollment.Status == EnrollmentStatus.Completed)
            {
                return Ok(new ContinueLearningResponseDto
                {
                    CourseCompleted = true
                });
            }

            // Load all lessons for the course ordered by Order
            var allLessons = await _context.Lessons
                .Where(l => l.CourseId == courseId)
                .OrderBy(l => l.Order)
                .ToListAsync();

            if (allLessons.Count == 0)
            {
                // No lessons in course - return course completed
                return Ok(new ContinueLearningResponseDto
                {
                    CourseCompleted = true
                });
            }

            // Load completed lesson IDs for this student in this course
            // Use safe approach that handles orphaned records
            var completedLessonIds = new List<int>();
            try
            {
                completedLessonIds = await _context.LessonCompletions
                    .Where(lc => lc.UserId == userId)
                    .Join(_context.Lessons.Where(l => l.CourseId == courseId),
                        lc => lc.LessonId,
                        l => l.Id,
                        (lc, l) => lc.LessonId)
                    .Distinct()
                    .ToListAsync();
            }
            catch
            {
                // If join fails, try alternative approach
                var allCourseLessonIds = allLessons.Select(l => l.Id).ToList();
                if (allCourseLessonIds.Any())
                {
                    completedLessonIds = await _context.LessonCompletions
                        .Where(lc => lc.UserId == userId && allCourseLessonIds.Contains(lc.LessonId))
                        .Select(lc => lc.LessonId)
                        .Distinct()
                        .ToListAsync();
                }
            }

            // Find the first uncompleted lesson
            var completedLessonIdsSafe = completedLessonIds ?? new List<int>();
            var nextLesson = allLessons
                .FirstOrDefault(l => !completedLessonIdsSafe.Contains(l.Id));

            if (nextLesson == null)
            {
                // All lessons are completed - course is completed
                return Ok(new ContinueLearningResponseDto
                {
                    CourseCompleted = true
                });
            }

            // Return next lesson information (ensure Title is never null)
            return Ok(new ContinueLearningResponseDto
            {
                CourseCompleted = false,
                LessonId = nextLesson.Id,
                LessonTitle = nextLesson.Title ?? string.Empty,
                LessonOrder = nextLesson.Order
            });
        }

        /// <summary>
        /// Generates a secure download token for a lesson video
        /// </summary>
        private string GenerateDownloadToken(int userId, int lessonId, DateTime expiresAt)
        {
            var jwt = _configuration.GetSection("Jwt");
            var key = jwt["Key"] ?? "dev_secret_replace_with_env_or_user_secrets_change_me";
            var issuer = jwt["Issuer"] ?? "OnlineLearningPlatform";
            var audience = jwt["Audience"] ?? "OnlineLearningPlatformAudience";

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new Claim("lessonId", lessonId.ToString()),
                new Claim("type", "video_download")
            };

            var keyBytes = Encoding.UTF8.GetBytes(key);
            var creds = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expiresAt,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [HttpGet("lessons/{lessonId}/download-url")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetDownloadUrl(int lessonId, [FromQuery] string deviceId = null)
        {
            // Get logged-in userId from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            // Verify lesson exists
            var lesson = await _context.Lessons
                .Include(l => l.Course)
                .FirstOrDefaultAsync(l => l.Id == lessonId);

            if (lesson == null)
            {
                return NotFound(new { message = "Lesson not found" });
            }

            // Verify student is enrolled in the course
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == lesson.CourseId);

            if (enrollment == null)
            {
                return Forbid("You must be enrolled in this course to download videos");
            }

            // Check if video URL exists
            if (string.IsNullOrEmpty(lesson.VideoUrl))
            {
                return BadRequest(new { message = "This lesson does not have a video" });
            }

            // Set expiration (30 days from now for offline access)
            var expiresAt = DateTime.UtcNow.AddDays(30);

            // Check if there's an existing active download record
            var existingDownload = await _context.OfflineVideoDownloads
                .FirstOrDefaultAsync(d => d.UserId == userId && d.LessonId == lessonId && d.IsActive);

            if (existingDownload != null)
            {
                // Update expiration if needed
                if (existingDownload.ExpiresAt < expiresAt)
                {
                    existingDownload.ExpiresAt = expiresAt;
                }
                if (!string.IsNullOrEmpty(deviceId))
                {
                    existingDownload.DeviceId = deviceId;
                }
                await _context.SaveChangesAsync();
            }
            else
            {
                // Create new download record
                var download = new OfflineVideoDownload
                {
                    UserId = userId,
                    LessonId = lessonId,
                    DownloadedAt = DateTime.UtcNow,
                    ExpiresAt = expiresAt,
                    DeviceId = deviceId,
                    IsActive = true
                };
                _context.OfflineVideoDownloads.Add(download);
                await _context.SaveChangesAsync();
            }

            // Generate secure download token
            var token = GenerateDownloadToken(userId, lessonId, expiresAt);

            // Create download URL with token
            // In production, this would be a secure endpoint that validates the token and streams the video
            // For now, we'll return the original video URL with a token parameter
            // The frontend should use this token when downloading
            var downloadUrl = $"{Request.Scheme}://{Request.Host}/api/student/videos/{lessonId}/download?token={Uri.EscapeDataString(token)}";

            return Ok(new DownloadAuthorizationDto
            {
                DownloadUrl = downloadUrl,
                ExpiresAt = expiresAt,
                LessonId = lessonId
            });
        }

        [HttpGet("videos/{lessonId}/download")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> DownloadVideo(int lessonId, [FromQuery] string token)
        {
            // Get logged-in userId from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            // Validate token
            try
            {
                var jwt = _configuration.GetSection("Jwt");
                var key = jwt["Key"] ?? "dev_secret_replace_with_env_or_user_secrets_change_me";
                var issuer = jwt["Issuer"] ?? "OnlineLearningPlatform";
                var audience = jwt["Audience"] ?? "OnlineLearningPlatformAudience";

                var tokenHandler = new JwtSecurityTokenHandler();
                var keyBytes = Encoding.UTF8.GetBytes(key);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
                    ValidateIssuer = true,
                    ValidIssuer = issuer,
                    ValidateAudience = true,
                    ValidAudience = audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
                var jwtToken = validatedToken as JwtSecurityToken;

                // Verify token type and lesson ID
                var tokenLessonId = jwtToken?.Claims.FirstOrDefault(c => c.Type == "lessonId")?.Value;
                var tokenType = jwtToken?.Claims.FirstOrDefault(c => c.Type == "type")?.Value;
                var tokenUserId = jwtToken?.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value;

                if (tokenType != "video_download" || 
                    !int.TryParse(tokenLessonId, out var tokenLessonIdInt) || 
                    tokenLessonIdInt != lessonId ||
                    tokenUserId != userId.ToString())
                {
                    return Unauthorized(new { message = "Invalid download token" });
                }
            }
            catch
            {
                return Unauthorized(new { message = "Invalid or expired download token" });
            }

            // Verify lesson exists and user has access
            var lesson = await _context.Lessons
                .Include(l => l.Course)
                .FirstOrDefaultAsync(l => l.Id == lessonId);

            if (lesson == null)
            {
                return NotFound(new { message = "Lesson not found" });
            }

            // Verify student is enrolled
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == lesson.CourseId);

            if (enrollment == null)
            {
                return Forbid("You must be enrolled in this course to download videos");
            }

            // Check if video URL exists
            if (string.IsNullOrEmpty(lesson.VideoUrl))
            {
                return NotFound(new { message = "Video not found" });
            }

            // For now, redirect to the video URL
            // In production, you might want to proxy the video through your server
            // or use a signed URL from your storage provider (AWS S3, Azure Blob, etc.)
            return Redirect(lesson.VideoUrl);
        }

        [HttpGet("quizzes")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetMyQuizzes()
        {
            try
            {
                // Get logged-in userId from JWT claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                // Get all enrollments for this user
                var enrollments = await _context.Enrollments
                    .Where(e => e.UserId == userId)
                    .Select(e => e.CourseId)
                    .ToListAsync();

                if (enrollments == null || enrollments.Count == 0)
                {
                    // No enrollments - return empty array
                    return Ok(new List<object>());
                }

                // Get all quizzes for enrolled courses with questions count
                var quizzes = await _context.Quizzes
                    .Where(q => enrollments.Contains(q.CourseId))
                    .Include(q => q.Course)
                    .Include(q => q.Questions)
                    .ToListAsync();

                // Get quiz attempts for this user to determine status
                var quizAttempts = await _context.QuizAttempts
                    .Where(qa => qa.UserId == userId)
                    .ToListAsync();

                // Group attempts by quiz ID to get best score and pass status
                var attemptsByQuiz = quizAttempts
                    .GroupBy(qa => qa.QuizId)
                    .ToDictionary(g => g.Key, g => new
                    {
                        bestScore = g.Max(a => a.Score),
                        passed = g.Any(a => a.Passed),
                        lastAttemptDate = g.Max(a => a.AttemptDate),
                        attemptCount = g.Count()
                    });

                // Build response with quiz status
                var quizzesWithStatus = quizzes
                    .Where(q => q != null && q.Course != null)
                    .Select(q =>
                    {
                        var attemptInfo = attemptsByQuiz.ContainsKey(q.Id) ? attemptsByQuiz[q.Id] : null;
                        var hasAttempts = attemptInfo != null;
                        var status = hasAttempts && attemptInfo != null && attemptInfo.passed ? "completed" : hasAttempts ? "completed" : "not-started";

                        return new
                        {
                            id = q.Id,
                            quizId = q.Id,
                            title = q.Title ?? string.Empty,
                            course = q.Course?.Title ?? string.Empty,
                            courseId = q.CourseId,
                            status = status,
                            score = attemptInfo != null ? attemptInfo.bestScore : (int?)null,
                            maxScore = 100,
                            date = attemptInfo != null ? attemptInfo.lastAttemptDate : (DateTime?)null,
                            duration = q.TimeLimit > 0 ? $"{q.TimeLimit} minutes" : "No limit",
                            questions = q.Questions != null ? q.Questions.Count : 0,
                            passingScore = q.PassingScore,
                            canRetake = true // Always allow retake
                        };
                    })
                    .OrderByDescending(q => q.date ?? DateTime.MinValue)
                    .ToList();

                // Always return array, never null
                // quizzesWithStatus is already a List, so we don't need null coalescing
                return Ok(quizzesWithStatus);
            }
            catch (Exception ex)
            {
                // Log the error but return empty array instead of error
                Console.WriteLine($"Error in GetMyQuizzes: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                // Return empty array instead of error to prevent UI showing retry
                return Ok(new List<object>());
            }
        }

        [HttpGet("quiz-attempts")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetQuizAttempts()
        {
            try
            {
                // Get logged-in userId from JWT claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                // Get all quiz attempts for this user with quiz and course information
                // Use safe approach that handles orphaned records
                var attempts = new List<object>();
                try
                {
                    attempts = await _context.QuizAttempts
                        .Where(qa => qa.UserId == userId)
                        .Join(_context.Quizzes,
                            qa => qa.QuizId,
                            q => q.Id,
                            (qa, q) => new { qa, q })
                        .Join(_context.Courses,
                            x => x.q.CourseId,
                            c => c.Id,
                            (x, c) => new
                            {
                                id = x.qa.Id,
                                quizId = x.qa.QuizId,
                                quizTitle = x.q.Title ?? string.Empty,
                                courseId = c.Id,
                                courseTitle = c.Title ?? string.Empty,
                                score = x.qa.Score,
                                passed = x.qa.Passed,
                                attemptDate = x.qa.AttemptDate,
                                passingScore = x.q.PassingScore
                            })
                        .OrderByDescending(x => x.attemptDate)
                        .ToListAsync<object>();
                }
                catch
                {
                    // If join fails, try alternative approach
                    var allQuizAttempts = await _context.QuizAttempts
                        .Where(qa => qa.UserId == userId)
                        .ToListAsync();

                    var quizIds = allQuizAttempts.Select(qa => qa.QuizId).Distinct().ToList();
                    var quizzes = await _context.Quizzes
                        .Where(q => quizIds.Contains(q.Id))
                        .ToListAsync();

                    var courseIds = quizzes.Select(q => q.CourseId).Distinct().ToList();
                    var courses = await _context.Courses
                        .Where(c => courseIds.Contains(c.Id))
                        .ToListAsync();

                    attempts = allQuizAttempts
                        .Select(qa =>
                        {
                            var quiz = quizzes.FirstOrDefault(q => q.Id == qa.QuizId);
                            var course = quiz != null ? courses.FirstOrDefault(c => c.Id == quiz.CourseId) : null;
                            return new
                            {
                                id = qa.Id,
                                quizId = qa.QuizId,
                                quizTitle = quiz?.Title ?? string.Empty,
                                courseId = course?.Id ?? 0,
                                courseTitle = course?.Title ?? string.Empty,
                                score = qa.Score,
                                passed = qa.Passed,
                                attemptDate = qa.AttemptDate,
                                passingScore = quiz?.PassingScore ?? 0
                            };
                        })
                        .OrderByDescending(x => x.attemptDate)
                        .ToList<object>();
                }

                // Always return array, never null
                return Ok(attempts ?? new List<object>());
            }
            catch (Exception ex)
            {
                // Log the error but return empty array instead of error
                Console.WriteLine($"Error in GetQuizAttempts: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                // Return empty array instead of error to prevent UI showing retry
                return Ok(new List<object>());
            }
        }

        [HttpPost("lessons/offline-progress/sync")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> SyncOfflineProgress(SyncOfflineProgressDto dto)
        {
            // Get logged-in userId from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            var syncedProgressCount = 0;
            var syncedCompletionCount = 0;
            var failedLessonIds = new List<int>();

            // Sync video progress updates
            foreach (var progressUpdate in dto.ProgressUpdates ?? new List<OfflineProgressItemDto>())
            {
                try
                {
                    // Verify lesson exists and user has access
                    var lesson = await _context.Lessons
                        .Include(l => l.Course)
                        .FirstOrDefaultAsync(l => l.Id == progressUpdate.LessonId);

                    if (lesson == null)
                    {
                        failedLessonIds.Add(progressUpdate.LessonId);
                        continue;
                    }

                    // Verify enrollment
                    var enrollment = await _context.Enrollments
                        .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == lesson.CourseId);

                    if (enrollment == null)
                    {
                        failedLessonIds.Add(progressUpdate.LessonId);
                        continue;
                    }

                    // Find existing progress or create new
                    var existingProgress = await _context.LessonVideoProgresses
                        .FirstOrDefaultAsync(vp => vp.UserId == userId && vp.LessonId == progressUpdate.LessonId);

                    if (existingProgress != null)
                    {
                        // Only update if the new progress is greater (to avoid going backwards)
                        if (progressUpdate.LastWatchedSeconds > existingProgress.LastWatchedSeconds)
                        {
                            existingProgress.LastWatchedSeconds = progressUpdate.LastWatchedSeconds;
                            existingProgress.LastUpdatedAt = DateTime.UtcNow;
                        }
                    }
                    else
                    {
                        var newProgress = new LessonVideoProgress
                        {
                            UserId = userId,
                            LessonId = progressUpdate.LessonId,
                            LastWatchedSeconds = progressUpdate.LastWatchedSeconds,
                            LastUpdatedAt = DateTime.UtcNow
                        };
                        _context.LessonVideoProgresses.Add(newProgress);
                    }

                    // Update enrollment LastAccessed
                    enrollment.LastAccessed = DateTime.UtcNow;

                    syncedProgressCount++;
                }
                catch
                {
                    failedLessonIds.Add(progressUpdate.LessonId);
                }
            }

            // Sync lesson completions
            foreach (var lessonId in dto.CompletedLessonIds ?? new List<int>())
            {
                try
                {
                    // Verify lesson exists and user has access
                    var lesson = await _context.Lessons
                        .Include(l => l.Course)
                        .FirstOrDefaultAsync(l => l.Id == lessonId);

                    if (lesson == null)
                    {
                        failedLessonIds.Add(lessonId);
                        continue;
                    }

                    // Verify enrollment
                    var enrollment = await _context.Enrollments
                        .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == lesson.CourseId);

                    if (enrollment == null)
                    {
                        failedLessonIds.Add(lessonId);
                        continue;
                    }

                    // Check if already completed
                    var existingCompletion = await _context.LessonCompletions
                        .FirstOrDefaultAsync(lc => lc.UserId == userId && lc.LessonId == lessonId);

                    if (existingCompletion == null)
                    {
                        var completion = new LessonCompletion
                        {
                            UserId = userId,
                            LessonId = lessonId,
                            CompletedDate = DateTime.UtcNow
                        };
                        _context.LessonCompletions.Add(completion);

                        // Update enrollment LastAccessed
                        enrollment.LastAccessed = DateTime.UtcNow;

                        // Check and update course completion status
                        await CheckAndUpdateCourseCompletion(userId, lesson.CourseId);
                    }

                    syncedCompletionCount++;
                }
                catch
                {
                    failedLessonIds.Add(lessonId);
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new SyncOfflineProgressResponseDto
            {
                SyncedProgressCount = syncedProgressCount,
                SyncedCompletionCount = syncedCompletionCount,
                FailedLessonIds = failedLessonIds
            });
        }

        /// <summary>
        /// Checks if a course is completed for a student and updates enrollment status accordingly.
        /// A course is completed when all lessons are completed AND all quizzes are passed.
        /// </summary>
        private async Task CheckAndUpdateCourseCompletion(int userId, int courseId)
        {
            try
            {
                // Reload enrollment from database to ensure we have the latest data
                var enrollment = await _context.Enrollments
                    .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);

                if (enrollment == null)
                {
                    return; // Enrollment doesn't exist, skip check
                }

                // Get total counts - safe even if no lessons/quizzes exist
                var totalLessons = await _context.Lessons
                    .Where(l => l.CourseId == courseId)
                    .CountAsync();
                var totalQuizzes = await _context.Quizzes
                    .Where(q => q.CourseId == courseId)
                    .CountAsync();

                // Get completed lessons (distinct lesson IDs completed by this user in this course)
                // Use safe approach that handles orphaned records
                var completedLessonIds = new List<int>();
                try
                {
                    completedLessonIds = await _context.LessonCompletions
                        .Where(lc => lc.UserId == userId)
                        .Join(_context.Lessons.Where(l => l.CourseId == courseId),
                            lc => lc.LessonId,
                            l => l.Id,
                            (lc, l) => lc.LessonId)
                        .Distinct()
                        .ToListAsync();
                }
                catch
                {
                    // If join fails, try alternative approach
                    var allCourseLessonIds = await _context.Lessons
                        .Where(l => l.CourseId == courseId)
                        .Select(l => l.Id)
                        .ToListAsync();
                    
                    completedLessonIds = await _context.LessonCompletions
                        .Where(lc => lc.UserId == userId && allCourseLessonIds.Contains(lc.LessonId))
                        .Select(lc => lc.LessonId)
                        .Distinct()
                        .ToListAsync();
                }
                var completedLessons = completedLessonIds?.Count ?? 0;

                // Get completed quizzes (all attempted) and passed quizzes (only passed)
                var completedQuizIds = new List<int>();
                var passedQuizIds = new List<int>();
                try
                {
                    var allCourseQuizIds = await _context.Quizzes
                        .Where(q => q.CourseId == courseId)
                        .Select(q => q.Id)
                        .ToListAsync();
                    
                    if (allCourseQuizIds.Any())
                    {
                        // For each quiz, get the latest attempt
                        foreach (var quizId in allCourseQuizIds)
                        {
                            var latestAttempt = await _context.QuizAttempts
                                .Where(qa => qa.UserId == userId && qa.QuizId == quizId)
                                .OrderByDescending(qa => qa.AttemptDate)
                                .FirstOrDefaultAsync();
                            
                            // Quiz is completed if any attempt exists
                            if (latestAttempt != null)
                            {
                                completedQuizIds.Add(quizId);
                                
                                // Quiz is passed if latest attempt passed
                                if (latestAttempt.Passed)
                                {
                                    passedQuizIds.Add(quizId);
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    // Log error but continue
                    Console.WriteLine($"Error checking quiz completion: {ex.Message}");
                }
                var completedQuizzes = completedQuizIds?.Count ?? 0;
                var passedQuizzes = passedQuizIds?.Count ?? 0;

                // Check if course is completed: ALL lessons completed AND ALL quizzes attempted (completed)
                // A course is COMPLETED when:
                // ✅ All lessons are completed
                // ✅ All quizzes are attempted/completed (student submitted them, regardless of pass/fail)
                // Handle edge cases: if no lessons/quizzes exist, course is considered completed if user has started it
                bool isCompleted = false;
                if (totalLessons == 0 && totalQuizzes == 0)
                {
                    // Course with no content - consider it completed if user has started it
                    isCompleted = enrollment.Status == EnrollmentStatus.InProgress || enrollment.Status == EnrollmentStatus.Completed;
                }
                else
                {
                    // Normal case: all lessons completed AND all quizzes attempted/completed
                    // Both requirements must be met for course completion
                    bool allLessonsCompleted = totalLessons == 0 || completedLessons >= totalLessons;
                    bool allQuizzesCompleted = totalQuizzes == 0 || completedQuizzes >= totalQuizzes;
                    isCompleted = allLessonsCompleted && allQuizzesCompleted;
                }
                
                // Debug logging
                Console.WriteLine($"Course completion check for User {userId}, Course {courseId}:");
                Console.WriteLine($"  Total Lessons: {totalLessons}, Completed: {completedLessons}");
                Console.WriteLine($"  Total Quizzes: {totalQuizzes}, Completed: {completedQuizzes}, Passed: {passedQuizzes}");
                Console.WriteLine($"  Is Completed: {isCompleted}, Current Status: {enrollment.Status}");

                // Update enrollment status
                bool wasJustCompleted = false;
                if (isCompleted && enrollment.Status != EnrollmentStatus.Completed)
                {
                    Console.WriteLine($"  Updating enrollment status to Completed for User {userId}, Course {courseId}");
                    enrollment.Status = EnrollmentStatus.Completed;
                    enrollment.CompletedAt = DateTime.UtcNow;
                    // Also update LastAccessed to completion time
                    enrollment.LastAccessed = DateTime.UtcNow;
                    wasJustCompleted = true;
                }
                else if (!isCompleted && enrollment.Status == EnrollmentStatus.Completed)
                {
                    // Course was marked as completed but no longer meets criteria (edge case)
                    // Revert to InProgress
                    enrollment.Status = EnrollmentStatus.InProgress;
                    enrollment.CompletedAt = null;
                }
                else if (!isCompleted && enrollment.Status == EnrollmentStatus.NotStarted)
                {
                    // If not started but has progress, mark as InProgress
                    if (completedLessons > 0 || passedQuizzes > 0)
                    {
                        enrollment.Status = EnrollmentStatus.InProgress;
                        if (!enrollment.StartedAt.HasValue)
                        {
                            enrollment.StartedAt = DateTime.UtcNow;
                        }
                    }
                }

                await _context.SaveChangesAsync();
                
                Console.WriteLine($"  Enrollment status after save: {enrollment.Status}");

                // Generate certificate if course was just completed
                if (wasJustCompleted)
                {
                    Console.WriteLine($"  Generating certificate for User {userId}, Course {courseId}");
                    await GenerateCertificateIfNotExists(userId, courseId);
                }
            }
            catch (Exception ex)
            {
                // Log the error but don't throw - this is a helper method
                Console.WriteLine($"Error in CheckAndUpdateCourseCompletion for user {userId}, course {courseId}: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                // Don't rethrow - let the calling method handle the error
            }
        }

        /// <summary>
        /// Generates a certificate for a completed course if one doesn't already exist.
        /// </summary>
        private async Task GenerateCertificateIfNotExists(int userId, int courseId)
        {
            try
            {
                // Check if certificate already exists
                var existingCertificate = await _context.Certificates
                    .FirstOrDefaultAsync(c => c.UserId == userId && c.CourseId == courseId);

                if (existingCertificate != null)
                {
                    // Certificate already exists, no need to create another one
                    return;
                }

                // Verify course exists
                var course = await _context.Courses.FindAsync(courseId);
                if (course == null)
                {
                    Console.WriteLine($"Cannot generate certificate: Course {courseId} not found");
                    return;
                }

                // Verify user exists
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    Console.WriteLine($"Cannot generate certificate: User {userId} not found");
                    return;
                }

                // Generate verification code
                var verificationCode = $"CERT-{DateTime.UtcNow:yyyyMMdd}-{courseId:D4}-{userId:D4}-{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}";

                // Create new certificate
                var certificate = new Certificate
                {
                    UserId = userId,
                    CourseId = courseId,
                    GeneratedAt = DateTime.UtcNow,
                    VerificationCode = verificationCode,
                    DownloadUrl = string.Empty // PDF is generated on-demand, no static URL needed
                };

                _context.Certificates.Add(certificate);
                await _context.SaveChangesAsync();

                Console.WriteLine($"Certificate generated for User {userId}, Course {courseId}");
            }
            catch (Exception ex)
            {
                // Log the error but don't throw - certificate generation failure shouldn't break course completion
                Console.WriteLine($"Error generating certificate for user {userId}, course {courseId}: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
            }
        }

        [HttpGet("certificates")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetMyCertificates()
        {
            try
            {
                // Get logged-in userId from JWT claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                // Get all certificates for this user with course and creator information
                var certificates = await _context.Certificates
                    .Where(c => c.UserId == userId)
                    .Include(c => c.Course)
                        .ThenInclude(course => course.Creator)
                    .OrderByDescending(c => c.GeneratedAt)
                    .ToListAsync();

                // If no certificates, return empty list (NOT error)
                if (certificates == null || certificates.Count == 0)
                {
                    return Ok(new List<object>());
                }

                // Build response with course and instructor information
                var certificatesWithDetails = certificates
                    .Where(c => c.Course != null)
                    .Select(c => new
                    {
                        id = c.Id,
                        course = c.Course.Title ?? string.Empty,
                        courseId = c.CourseId,
                        instructor = c.Course.Creator != null ? c.Course.Creator.FullName ?? string.Empty : string.Empty,
                        issueDate = c.GeneratedAt,
                        completionDate = c.GeneratedAt, // Use GeneratedAt as completion date
                        verificationCode = c.VerificationCode ?? $"CERT-{c.Id:D6}-{c.CourseId:D4}",
                        downloadUrl = c.DownloadUrl ?? string.Empty
                    })
                    .ToList();

                // Always return array, never null (ToList() never returns null)
                return Ok(certificatesWithDetails);
            }
            catch (Exception ex)
            {
                // Log the error but return empty array instead of error
                Console.WriteLine($"Error in GetMyCertificates: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return Ok(new List<object>());
            }
        }

        [HttpGet("certificates/{certificateId}/download")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> DownloadCertificate(int certificateId)
        {
            try
            {
                // Get logged-in userId from JWT claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                // Load certificate with all required data
                var certificate = await _context.Certificates
                    .Include(c => c.User)
                    .Include(c => c.Course)
                        .ThenInclude(course => course.Creator)
                    .FirstOrDefaultAsync(c => c.Id == certificateId);

                if (certificate == null)
                {
                    return NotFound(new { message = "Certificate not found" });
                }

                // Validate: Certificate must belong to logged-in student
                if (certificate.UserId != userId)
                {
                    return Forbid("You can only download your own certificates");
                }

                // Validate required data
                if (certificate.User == null || certificate.Course == null)
                {
                    return BadRequest(new { message = "Certificate data is incomplete" });
                }

                // Generate PDF
                var pdfBytes = _pdfService.GenerateCertificatePdf(
                    certificate,
                    certificate.User,
                    certificate.Course,
                    certificate.Course.Creator
                );

                // Return PDF file
                var fileName = $"Certificate_{certificate.Course.Title?.Replace(" ", "_") ?? "Course"}_{certificate.Id}.pdf";
                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error downloading certificate {certificateId}: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Error generating certificate PDF" });
            }
        }

        [HttpGet("profile")]
        [Authorize(Roles = "Student")]
        public async Task<ActionResult> GetProfile()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                return Ok(new
                {
                    fullName = user.FullName,
                    email = user.Email
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching profile: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching profile" });
            }
        }

        [HttpPut("profile")]
        [Authorize(Roles = "Student")]
        public async Task<ActionResult> UpdateProfile(UpdateProfileDto dto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                if (string.IsNullOrWhiteSpace(dto?.FullName))
                {
                    return BadRequest(new { message = "Full name is required" });
                }

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                user.FullName = dto.FullName.Trim();
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Profile updated successfully",
                    fullName = user.FullName,
                    email = user.Email
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating profile: {ex.Message}");
                return StatusCode(500, new { message = "Error updating profile" });
            }
        }

        [HttpPut("change-password")]
        [Authorize(Roles = "Student")]
        public async Task<ActionResult> ChangePassword(ChangePasswordDto dto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                if (string.IsNullOrWhiteSpace(dto?.CurrentPassword))
                {
                    return BadRequest(new { message = "Current password is required" });
                }

                if (string.IsNullOrWhiteSpace(dto?.NewPassword))
                {
                    return BadRequest(new { message = "New password is required" });
                }

                if (dto.NewPassword != dto.ConfirmPassword)
                {
                    return BadRequest(new { message = "New password and confirm password do not match" });
                }

                if (dto.NewPassword.Length < 8)
                {
                    return BadRequest(new { message = "New password must be at least 8 characters long" });
                }

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Verify current password
                var passwordVerificationResult = _passwordHasher.VerifyHashedPassword(user: null, user.HashedPassword, dto.CurrentPassword);
                
                // Also check SHA256 fallback for backward compatibility
                bool passwordValid = false;
                if (passwordVerificationResult == PasswordVerificationResult.Success || 
                    passwordVerificationResult == PasswordVerificationResult.SuccessRehashNeeded)
                {
                    passwordValid = true;
                }
                else
                {
                    // Fallback to SHA256 for backward compatibility
                    using var sha256 = SHA256.Create();
                    var hashed = Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(dto.CurrentPassword)));
                    if (user.HashedPassword == hashed)
                    {
                        passwordValid = true;
                    }
                }

                if (!passwordValid)
                {
                    return Unauthorized(new { message = "Current password is incorrect" });
                }

                // Hash and save new password
                user.HashedPassword = _passwordHasher.HashPassword(user: null, dto.NewPassword);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error changing password: {ex.Message}");
                return StatusCode(500, new { message = "Error changing password" });
            }
        }
    }
}

