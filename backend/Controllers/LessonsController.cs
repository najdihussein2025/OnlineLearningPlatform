using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.Lesson;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LessonsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LessonsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LessonResponseDto>>> GetLessons()
        {
            var lessons = await _context.Lessons.ToListAsync();
            var dtos = lessons.Select(l => new LessonResponseDto
            {
                Id = l.Id,
                CourseId = l.CourseId,
                Title = l.Title,
                Content = l.Content,
                VideoUrl = l.VideoUrl,
                Order = l.Order,
                EstimatedDuration = l.EstimatedDuration,
                CreatedAt = l.CreatedAt
            }).ToList();
            return Ok(dtos);
        }

        [Authorize]
        [HttpGet("byCourse/{courseId}")]
        public async Task<ActionResult<IEnumerable<LessonResponseDto>>> GetLessonsByCourse(int courseId)
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
                Order = l.Order,
                EstimatedDuration = l.EstimatedDuration,
                CreatedAt = l.CreatedAt
            }).ToList();

            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LessonResponseDto>> GetLesson(int id)
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
                Order = l.Order,
                EstimatedDuration = l.EstimatedDuration,
                CreatedAt = l.CreatedAt
            };
            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<LessonResponseDto>> CreateLesson(CreateLessonDto dto)
        {
            var lesson = new Lesson
            {
                CourseId = dto.CourseId,
                Title = dto.Title,
                Content = dto.Content,
                VideoUrl = dto.VideoUrl,
                Order = dto.Order,
                EstimatedDuration = dto.EstimatedDuration
            };

            _context.Lessons.Add(lesson);
            await _context.SaveChangesAsync();

            var response = new LessonResponseDto
            {
                Id = lesson.Id,
                CourseId = lesson.CourseId,
                Title = lesson.Title,
                Content = lesson.Content,
                VideoUrl = lesson.VideoUrl,
                Order = lesson.Order,
                EstimatedDuration = lesson.EstimatedDuration,
                CreatedAt = lesson.CreatedAt
            };

            return CreatedAtAction(nameof(GetLesson), new { id = lesson.Id }, response);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLesson(int id, UpdateLessonDto dto)
        {
            var lesson = await _context.Lessons.FindAsync(id);
            if (lesson == null) return NotFound();

            lesson.Title = dto.Title ?? lesson.Title;
            lesson.Content = dto.Content ?? lesson.Content;
            lesson.VideoUrl = dto.VideoUrl ?? lesson.VideoUrl;
            lesson.Order = dto.Order ?? lesson.Order;
            lesson.EstimatedDuration = dto.EstimatedDuration ?? lesson.EstimatedDuration;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLesson(int id)
        {
            var lesson = await _context.Lessons.FindAsync(id);
            if (lesson == null) return NotFound();

            _context.Lessons.Remove(lesson);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Lesson deleted successfully" });
        }
    }
}