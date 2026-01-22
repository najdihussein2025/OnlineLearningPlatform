using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.Lesson;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using ids.Services;
using Microsoft.AspNetCore.Hosting;
using System.Text.Json;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LessonsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public LessonsController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LessonResponseDto>>> GetLessons()
        {
            try
            {
                var lessons = await _context.Lessons.ToListAsync();
                var dtos = lessons.Select(l => new LessonResponseDto
                {
                    Id = l.Id,
                    CourseId = l.CourseId,
                    Title = l.Title,
                    Content = l.Content,
                    VideoUrl = l.VideoUrl,
                    PdfUrl = l.PdfUrl,
                    ExternalUrl = l.ExternalUrl,
                    Order = l.Order,
                    EstimatedDuration = l.EstimatedDuration,
                    CreatedAt = l.CreatedAt
                }).ToList();
                return Ok(dtos);
            }
            catch (Exception ex)
            {
                ErrorLogger.Log(ex, _env);
                return StatusCode(500, new { message = "Error retrieving lessons" });
            }
        }

        [Authorize]
        [HttpGet("byCourse/{courseId}")]
        public async Task<ActionResult<IEnumerable<LessonResponseDto>>> GetLessonsByCourse(int courseId)
        {
            try
            {
                var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!int.TryParse(sub, out var userId)) return Unauthorized();

                var course = await _context.Courses.FindAsync(courseId);
                if (course == null) return NotFound();
                if (course.CreatedBy != userId) return Forbid();

                var lessons = await _context.Lessons.Where(l => l.CourseId == courseId).ToListAsync();
                var dtos = lessons.Select(l => new LessonResponseDto
                {
                    Id = l.Id,
                    CourseId = l.CourseId,
                    Title = l.Title,
                    Content = l.Content,
                    VideoUrl = l.VideoUrl,
                    PdfUrl = l.PdfUrl,
                    ExternalUrl = l.ExternalUrl,
                    Order = l.Order,
                    EstimatedDuration = l.EstimatedDuration,
                    CreatedAt = l.CreatedAt
                }).ToList();

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                ErrorLogger.Log(ex, _env);
                return StatusCode(500, new { message = "Error retrieving lessons for course" });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LessonResponseDto>> GetLesson(int id)
        {
            try
            {
                var l = await _context.Lessons.FindAsync(id);
                if (l == null) return NotFound();
                var dto = new LessonResponseDto
                {
                    Id = l.Id,
                    CourseId = l.CourseId,
                    Title = l.Title,
                    Content = l.Content,
                    VideoUrl = l.VideoUrl,
                    PdfUrl = l.PdfUrl,
                    ExternalUrl = l.ExternalUrl,
                    Order = l.Order,
                    EstimatedDuration = l.EstimatedDuration,
                    CreatedAt = l.CreatedAt
                };
                return Ok(dto);
            }
            catch (Exception ex)
            {
                ErrorLogger.Log(ex, _env);
                return StatusCode(500, new { message = "Error retrieving lesson" });
            }
        }

        [Authorize(Roles = "Instructor,Admin")]
        [HttpPost]
        public async Task<ActionResult<LessonResponseDto>> CreateLesson(CreateLessonDto dto)
        {
            try
            {
                // STEP 3: Log what ASP.NET receives
                Console.WriteLine("=== CreateLesson Received DTO ===");
                Console.WriteLine(JsonSerializer.Serialize(dto, new JsonSerializerOptions { WriteIndented = true }));
                Console.WriteLine($"CourseId: {dto?.CourseId}, Title: {dto?.Title}, Order: {dto?.Order}, EstimatedDuration: {dto?.EstimatedDuration}");

                // STEP 4: Check ModelState errors FIRST and return detailed BadRequest
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage ?? e.Exception?.Message ?? "Unknown error");

                    var errorDetails = ModelState.Keys
                        .Where(key => ModelState[key].Errors.Count > 0)
                        .Select(key => new { Field = key, Errors = ModelState[key].Errors.Select(e => e.ErrorMessage ?? e.Exception?.Message) })
                        .ToList();

                    Console.WriteLine("=== ModelState Validation Errors ===");
                    Console.WriteLine(JsonSerializer.Serialize(errorDetails, new JsonSerializerOptions { WriteIndented = true }));

                    return BadRequest(new { 
                        message = "Validation failed", 
                        errors = string.Join(" | ", errors),
                        details = errorDetails
                    });
                }

                // Only the owner (instructor) of the course or an admin can create lessons for it
                var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!int.TryParse(sub, out var userId)) return Unauthorized();

                // STEP 5: Verify course exists in DB with detailed error
                var course = await _context.Courses.FindAsync(dto.CourseId);
                if (course == null)
                {
                    Console.WriteLine($"=== Course Not Found ===");
                    Console.WriteLine($"Requested CourseId: {dto.CourseId}");
                    return BadRequest(new { message = $"Course not found with ID: {dto.CourseId}" });
                }
                
                if (course.CreatedBy != userId) return Forbid();

                // STEP 6: Verify all fields before creating entity
                Console.WriteLine("=== Creating Lesson Entity ===");
                Console.WriteLine($"CourseId: {dto.CourseId}");
                Console.WriteLine($"Title: {dto.Title ?? "(null)"}");
                Console.WriteLine($"Content: {(string.IsNullOrEmpty(dto.Content) ? "(empty/null)" : $"{dto.Content.Length} chars")}");
                Console.WriteLine($"VideoUrl: {dto.VideoUrl ?? "(null)"}");
                Console.WriteLine($"PdfUrl: {dto.PdfUrl ?? "(null)"}");
                Console.WriteLine($"ExternalUrl: {dto.ExternalUrl ?? "(null)"}");
                Console.WriteLine($"Order: {dto.Order}");
                Console.WriteLine($"EstimatedDuration: {dto.EstimatedDuration}");

                var lesson = new Lesson
                {
                    CourseId = dto.CourseId,
                    Title = dto.Title,
                    Content = dto.Content,
                    VideoUrl = dto.VideoUrl,
                    PdfUrl = dto.PdfUrl,
                    ExternalUrl = dto.ExternalUrl,
                    Order = dto.Order,
                    EstimatedDuration = dto.EstimatedDuration
                };

                _context.Lessons.Add(lesson);
                await _context.SaveChangesAsync();
                
                Console.WriteLine($"=== Lesson Created Successfully with ID: {lesson.Id} ===");

                // Log the creation
                var auditLog = new AuditLog
                {
                    Action = "Create",
                    EntityType = "Lesson",
                    EntityId = lesson.Id,
                    EntityName = lesson.Title,
                    Description = $"Lesson '{lesson.Title}' has been created",
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();

                var response = new LessonResponseDto
                {
                    Id = lesson.Id,
                    CourseId = lesson.CourseId,
                    Title = lesson.Title,
                    Content = lesson.Content,
                    VideoUrl = lesson.VideoUrl,
                    PdfUrl = lesson.PdfUrl,
                    ExternalUrl = lesson.ExternalUrl,
                    Order = lesson.Order,
                    EstimatedDuration = lesson.EstimatedDuration,
                    CreatedAt = lesson.CreatedAt
                };

                return CreatedAtAction(nameof(GetLesson), new { id = lesson.Id }, response);
            }
            catch (Exception ex)
            {
                ErrorLogger.Log(ex, _env);
                
                // Return 400 for validation errors, 500 for other errors
                var isValidationError = ex.Message.Contains("required", StringComparison.OrdinalIgnoreCase) ||
                                       ex.Message.Contains("invalid", StringComparison.OrdinalIgnoreCase) ||
                                       !ModelState.IsValid;
                
                var statusCode = isValidationError ? 400 : 500;
                return StatusCode(statusCode, new { message = ex.Message, error = "Error creating lesson" });
            }
        }

        [Authorize(Roles = "Instructor,Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLesson(int id, UpdateLessonDto dto)
        {
            try
            {
                var lesson = await _context.Lessons.FindAsync(id);
                if (lesson == null) return NotFound();

                var course = await _context.Courses.FindAsync(lesson.CourseId);
                var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!int.TryParse(sub, out var userId)) return Unauthorized();
                if (course == null) return NotFound(new { message = "Course not found" });
                if (course.CreatedBy != userId) return Forbid();

                var previousTitle = lesson.Title;
                
                // Update all fields - treat null as "don't change", but allow empty strings to clear fields
                if (dto.Title != null) lesson.Title = dto.Title;
                if (dto.Content != null) lesson.Content = dto.Content;
                if (dto.VideoUrl != null) lesson.VideoUrl = dto.VideoUrl;
                if (dto.PdfUrl != null) lesson.PdfUrl = dto.PdfUrl;
                if (dto.ExternalUrl != null) lesson.ExternalUrl = dto.ExternalUrl;
                if (dto.Order.HasValue) lesson.Order = dto.Order.Value;
                if (dto.EstimatedDuration.HasValue) lesson.EstimatedDuration = dto.EstimatedDuration.Value;

                await _context.SaveChangesAsync();

                // Log the update
                var auditLog = new AuditLog
                {
                    Action = "Update",
                    EntityType = "Lesson",
                    EntityId = lesson.Id,
                    EntityName = lesson.Title,
                    Description = $"Lesson '{previousTitle}' has been updated to '{lesson.Title}'",
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                ErrorLogger.Log(ex, _env);
                return StatusCode(500, new { message = "Error updating lesson" });
            }
        }

        [Authorize(Roles = "Instructor,Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLesson(int id)
        {
            try
            {
                var lesson = await _context.Lessons.FindAsync(id);
                if (lesson == null) return NotFound();

                var course = await _context.Courses.FindAsync(lesson.CourseId);
                var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!int.TryParse(sub, out var userId)) return Unauthorized();
                if (course == null) return NotFound(new { message = "Course not found" });
                
                var isAdmin = User.IsInRole("Admin");
                if (!isAdmin && course.CreatedBy != userId) return Forbid();

                // Log the deletion
                var auditLog = new AuditLog
                {
                    Action = "Delete",
                    EntityType = "Lesson",
                    EntityId = lesson.Id,
                    EntityName = lesson.Title,
                    Description = $"Lesson '{lesson.Title}' has been deleted",
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AuditLogs.Add(auditLog);

                _context.Lessons.Remove(lesson);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Lesson deleted successfully" });
            }
            catch (Exception ex)
            {
                ErrorLogger.Log(ex, _env);
                return StatusCode(500, new { message = "Error deleting lesson" });
            }
        }
    }
}