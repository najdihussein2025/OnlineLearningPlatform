using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.Quiz;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuizzesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public QuizzesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<QuizResponseDto>>> GetQuizzes()
        {
            var quizzes = await _context.Quizzes.ToListAsync();
            var dtos = quizzes.Select(q => new QuizResponseDto
            {
                Id = q.Id,
                CourseId = q.CourseId,
                LessonId = q.LessonId,
                Title = q.Title,
                PassingScore = q.PassingScore,
                TimeLimit = q.TimeLimit
            }).ToList();

            return Ok(dtos);
        }

        [Authorize]
        [HttpGet("byCourse/{courseId}")]
        public async Task<ActionResult<IEnumerable<QuizResponseDto>>> GetQuizzesByCourse(int courseId)
        {
            var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) return NotFound();
            if (course.CreatedBy != userId) return Forbid();

            var quizzes = await _context.Quizzes.Where(q => q.CourseId == courseId).ToListAsync();
            var dtos = quizzes.Select(q => new QuizResponseDto
            {
                Id = q.Id,
                CourseId = q.CourseId,
                LessonId = q.LessonId,
                Title = q.Title,
                PassingScore = q.PassingScore,
                TimeLimit = q.TimeLimit
            }).ToList();

            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<QuizResponseDto>> GetQuiz(int id)
        {
            var q = await _context.Quizzes.FindAsync(id);
            if (q == null) return NotFound();
            var dto = new QuizResponseDto
            {
                Id = q.Id,
                CourseId = q.CourseId,
                LessonId = q.LessonId,
                Title = q.Title,
                PassingScore = q.PassingScore,
                TimeLimit = q.TimeLimit
            };
            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<QuizResponseDto>> CreateQuiz(CreateQuizDto dto)
        {
            var quiz = new Quiz
            {
                CourseId = dto.CourseId,
                LessonId = dto.LessonId,
                Title = dto.Title,
                PassingScore = dto.PassingScore,
                TimeLimit = dto.TimeLimit
            };

            // Extract user ID from JWT for audit logging
            var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            int? userId = null;
            if (int.TryParse(sub, out var parsedId))
            {
                userId = parsedId;
            }

            _context.Quizzes.Add(quiz);
            await _context.SaveChangesAsync();

            // Log the creation
            var auditLog = new AuditLog
            {
                Action = "Create",
                EntityType = "Quiz",
                EntityId = quiz.Id,
                EntityName = quiz.Title,
                Description = $"Quiz '{quiz.Title}' has been created",
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            var response = new QuizResponseDto
            {
                Id = quiz.Id,
                CourseId = quiz.CourseId,
                LessonId = quiz.LessonId,
                Title = quiz.Title,
                PassingScore = quiz.PassingScore,
                TimeLimit = quiz.TimeLimit
            };

            return CreatedAtAction(nameof(GetQuiz), new { id = quiz.Id }, response);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateQuiz(int id, UpdateQuizDto dto)
        {
            var quiz = await _context.Quizzes.FindAsync(id);
            if (quiz == null) return NotFound();

            var previousTitle = quiz.Title;
            
            quiz.Title = dto.Title ?? quiz.Title;
            if (dto.PassingScore.HasValue) quiz.PassingScore = dto.PassingScore.Value;
            if (dto.TimeLimit.HasValue) quiz.TimeLimit = dto.TimeLimit.Value;

            // Extract user ID from JWT for audit logging
            var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            int? userId = null;
            if (int.TryParse(sub, out var parsedId))
            {
                userId = parsedId;
            }

            await _context.SaveChangesAsync();

            // Log the update
            var auditLog = new AuditLog
            {
                Action = "Update",
                EntityType = "Quiz",
                EntityId = quiz.Id,
                EntityName = quiz.Title,
                Description = $"Quiz '{previousTitle}' has been updated to '{quiz.Title}'",
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuiz(int id)
        {
            var quiz = await _context.Quizzes.FindAsync(id);
            if (quiz == null) return NotFound();

            // Log the deletion
            var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            int? userId = null;
            if (int.TryParse(sub, out var parsedId))
            {
                userId = parsedId;
            }

            var auditLog = new AuditLog
            {
                Action = "Delete",
                EntityType = "Quiz",
                EntityId = quiz.Id,
                EntityName = quiz.Title,
                Description = $"Quiz '{quiz.Title}' has been deleted",
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Quizzes.Remove(quiz);
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Quiz deleted successfully" });
        }
    }
}