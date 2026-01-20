using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.Answer;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnswersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AnswersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AnswerResponseDto>>> GetAnswers()
        {
            var answers = await _context.Answers.ToListAsync();
            var dtos = answers.Select(a => new AnswerResponseDto { Id = a.Id, QuestionId = a.QuestionId, AnswerText = a.AnswerText, IsCorrect = a.IsCorrect }).ToList();
            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AnswerResponseDto>> GetAnswer(int id)
        {
            var a = await _context.Answers.FindAsync(id);
            if (a == null) return NotFound();
            var dto = new AnswerResponseDto { Id = a.Id, QuestionId = a.QuestionId, AnswerText = a.AnswerText, IsCorrect = a.IsCorrect };
            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<AnswerResponseDto>> CreateAnswer(CreateAnswerDto dto)
        {
            var a = new Answer { QuestionId = dto.QuestionId, AnswerText = dto.AnswerText, IsCorrect = dto.IsCorrect };
            _context.Answers.Add(a);
            await _context.SaveChangesAsync();

            // Get question info for audit log
            var question = await _context.Questions.FindAsync(dto.QuestionId);

            // Log audit trail
            var auditLog = new AuditLog
            {
                Action = "Create",
                EntityType = "Answer",
                EntityId = a.Id,
                EntityName = question?.QuestionText ?? $"Question {dto.QuestionId}",
                Description = $"Answer created: {a.AnswerText} (Correct: {a.IsCorrect})",
                UserId = null,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            var response = new AnswerResponseDto { Id = a.Id, QuestionId = a.QuestionId, AnswerText = a.AnswerText, IsCorrect = a.IsCorrect };
            return CreatedAtAction(nameof(GetAnswer), new { id = a.Id }, response);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAnswer(int id, UpdateAnswerDto dto)
        {
            var a = await _context.Answers.FindAsync(id);
            if (a == null) return NotFound();

            a.AnswerText = dto.AnswerText ?? a.AnswerText;
            if (dto.IsCorrect.HasValue) a.IsCorrect = dto.IsCorrect.Value;

            await _context.SaveChangesAsync();

            // Get question info for audit log
            var question = await _context.Questions.FindAsync(a.QuestionId);

            // Log audit trail
            var auditLog = new AuditLog
            {
                Action = "Update",
                EntityType = "Answer",
                EntityId = a.Id,
                EntityName = question?.QuestionText ?? $"Question {a.QuestionId}",
                Description = $"Answer updated: {a.AnswerText}",
                UserId = null,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAnswer(int id)
        {
            var a = await _context.Answers.FindAsync(id);
            if (a == null) return NotFound();

            // Get question info for audit log
            var question = await _context.Questions.FindAsync(a.QuestionId);

            _context.Answers.Remove(a);
            await _context.SaveChangesAsync();

            // Log audit trail
            var auditLog = new AuditLog
            {
                Action = "Delete",
                EntityType = "Answer",
                EntityId = id,
                EntityName = question?.QuestionText ?? $"Question {a.QuestionId}",
                Description = $"Answer deleted: {a.AnswerText}",
                UserId = null,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Answer deleted successfully" });
        }
    }
}