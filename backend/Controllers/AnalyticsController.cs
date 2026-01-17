using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ids.Data;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Instructor,Admin")]
    public class AnalyticsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AnalyticsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public IActionResult GetStats()
        {
            // Get instructor id from claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var instructorId))
                return Unauthorized(new { message = "Invalid user token" });

            // Get courses created by this instructor
            var courseIds = _context.Courses
                .Where(c => c.CreatedBy == instructorId)
                .Select(c => c.Id)
                .ToList();

            var totalCourses = courseIds.Count;

            // Total enrollments for these courses
            var totalEnrollments = _context.Enrollments.Count(e => courseIds.Contains(e.CourseId));

            // Completed enrollments
            var completedEnrollments = _context.Enrollments.Count(e => courseIds.Contains(e.CourseId) && e.Status == Models.EnrollmentStatus.Completed);

            double courseCompletionRate = 0.0;
            if (totalEnrollments > 0)
                courseCompletionRate = Math.Round((double)completedEnrollments / totalEnrollments * 100.0, 2);

            // Average quiz score across quizzes in instructor's courses
            var quizIds = _context.Quizzes.Where(q => courseIds.Contains(q.CourseId)).Select(q => q.Id).ToList();
            var quizAttempts = _context.QuizAttempts.Where(a => quizIds.Contains(a.QuizId));
            double averageQuizScore = 0.0;
            if (quizAttempts.Any())
                averageQuizScore = Math.Round(quizAttempts.Average(a => a.Score), 2);

            // Active students (users with activity in last 30 days related to instructor's courses)
            var cutoff = DateTime.UtcNow.AddDays(-30);

            var activeFromEnrollments = _context.Enrollments
                .Where(e => courseIds.Contains(e.CourseId) && e.LastAccessed.HasValue && e.LastAccessed.Value >= cutoff)
                .Select(e => e.UserId);

            var lessonIds = _context.Lessons.Where(l => courseIds.Contains(l.CourseId)).Select(l => l.Id).ToList();

            var activeFromCompletions = _context.LessonCompletions
                .Where(lc => lessonIds.Contains(lc.LessonId) && lc.CompletedDate >= cutoff)
                .Select(lc => lc.UserId);

            var activeFromAttempts = _context.QuizAttempts
                .Where(a => quizIds.Contains(a.QuizId) && a.AttemptDate >= cutoff)
                .Select(a => a.UserId);

            var activeUsers = activeFromEnrollments
                .Union(activeFromCompletions)
                .Union(activeFromAttempts)
                .Distinct()
                .Count();

            return Ok(new
            {
                totalCourses,
                totalEnrollments,
                completedEnrollments,
                courseCompletionRate,
                averageQuizScore,
                activeStudents = activeUsers
            });
        }

        [HttpGet("course-enrollments")]
        public IActionResult GetCourseEnrollments()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var instructorId))
                return Unauthorized(new { message = "Invalid user token" });

            var courseEnrollments = _context.Courses
                .Where(c => c.CreatedBy == instructorId)
                .Select(c => new
                {
                    course = c.Title,
                    enrollments = _context.Enrollments.Count(e => e.CourseId == c.Id)
                })
                .ToList();

            return Ok(courseEnrollments);
        }
    }
}
