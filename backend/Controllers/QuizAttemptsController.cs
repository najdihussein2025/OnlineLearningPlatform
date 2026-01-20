using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.QuizAttempt;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuizAttemptsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public QuizAttemptsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<QuizAttemptResponseDto>>> GetAttempts()
        {
            var attempts = await _context.QuizAttempts.ToListAsync();
            var dtos = attempts.Select(a => new QuizAttemptResponseDto 
            { 
                Id = a.Id, 
                QuizId = a.QuizId, 
                UserId = a.UserId, 
                Score = a.Score, 
                Passed = a.Passed,
                AttemptDate = a.AttemptDate 
            }).ToList();
            return Ok(dtos);
        }

        [HttpPost]
        public async Task<ActionResult<QuizAttemptResponseDto>> CreateAttempt(CreateQuizAttemptDto dto)
        {
            var a = new QuizAttempt { QuizId = dto.QuizId, UserId = dto.UserId, Score = dto.Score, Passed = false };
            _context.QuizAttempts.Add(a);
            await _context.SaveChangesAsync();

            // Get quiz info for audit log
            var quiz = await _context.Quizzes.FindAsync(dto.QuizId);

            // Log audit trail
            var auditLog = new AuditLog
            {
                Action = "Create",
                EntityType = "QuizAttempt",
                EntityId = a.Id,
                EntityName = quiz?.Title ?? $"Quiz {dto.QuizId}",
                Description = $"Quiz attempt created - User: {dto.UserId}, Score: {dto.Score}%",
                UserId = dto.UserId,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            var response = new QuizAttemptResponseDto 
            { 
                Id = a.Id, 
                QuizId = a.QuizId, 
                UserId = a.UserId, 
                Score = a.Score, 
                Passed = a.Passed,
                AttemptDate = a.AttemptDate 
            };
            return CreatedAtAction(nameof(GetAttempts), new { id = a.Id }, response);
        }
    }
}