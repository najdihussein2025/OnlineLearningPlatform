using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.LessonCompletion;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LessonCompletionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LessonCompletionsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LessonCompletionResponseDto>>> GetCompletions()
        {
            var comps = await _context.LessonCompletions.ToListAsync();
            var dtos = comps.Select(c => new LessonCompletionResponseDto { Id = c.Id, LessonId = c.LessonId, UserId = c.UserId, CompletedDate = c.CompletedDate }).ToList();
            return Ok(dtos);
        }

        [HttpPost]
        public async Task<ActionResult<LessonCompletionResponseDto>> CreateCompletion(CreateLessonCompletionDto dto)
        {
            var c = new LessonCompletion { LessonId = dto.LessonId, UserId = dto.UserId };
            _context.LessonCompletions.Add(c);
            await _context.SaveChangesAsync();
            var response = new LessonCompletionResponseDto { Id = c.Id, LessonId = c.LessonId, UserId = c.UserId, CompletedDate = c.CompletedDate };
            return CreatedAtAction(nameof(GetCompletions), new { id = c.Id }, response);
        }
    }
}