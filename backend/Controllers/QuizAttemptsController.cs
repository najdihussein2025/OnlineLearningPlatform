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
            var dtos = attempts.Select(a => new QuizAttemptResponseDto { Id = a.Id, QuizId = a.QuizId, UserId = a.UserId, Score = a.Score, AttemptDate = a.AttemptDate }).ToList();
            return Ok(dtos);
        }

        [HttpPost]
        public async Task<ActionResult<QuizAttemptResponseDto>> CreateAttempt(CreateQuizAttemptDto dto)
        {
            var a = new QuizAttempt { QuizId = dto.QuizId, UserId = dto.UserId, Score = dto.Score };
            _context.QuizAttempts.Add(a);
            await _context.SaveChangesAsync();
            var response = new QuizAttemptResponseDto { Id = a.Id, QuizId = a.QuizId, UserId = a.UserId, Score = a.Score, AttemptDate = a.AttemptDate };
            return CreatedAtAction(nameof(GetAttempts), new { id = a.Id }, response);
        }
    }
}