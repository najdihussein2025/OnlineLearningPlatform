using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.Review;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReviewsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReviewResponseDto>>> GetReviews()
        {
            var reviews = await _context.Reviews.ToListAsync();
            var dtos = reviews.Select(r => new ReviewResponseDto { Id = r.Id, UserId = r.UserId, CourseId = r.CourseId, Rating = r.Rating, Comment = r.Comment, CreatedAt = r.CreatedAt }).ToList();
            return Ok(dtos);
        }

        [HttpPost]
        public async Task<ActionResult<ReviewResponseDto>> CreateReview(CreateReviewDto dto)
        {
            var r = new Review { UserId = dto.UserId, CourseId = dto.CourseId, Rating = dto.Rating, Comment = dto.Comment };
            _context.Reviews.Add(r);
            await _context.SaveChangesAsync();

            // Get course info for audit log
            var course = await _context.Courses.FindAsync(dto.CourseId);

            // Log audit trail
            var auditLog = new AuditLog
            {
                Action = "Create",
                EntityType = "Review",
                EntityId = r.Id,
                EntityName = course?.Title ?? $"Course {dto.CourseId}",
                Description = $"Review created with rating {dto.Rating}/5",
                UserId = dto.UserId,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            var response = new ReviewResponseDto { Id = r.Id, UserId = r.UserId, CourseId = r.CourseId, Rating = r.Rating, Comment = r.Comment, CreatedAt = r.CreatedAt };
            return CreatedAtAction(nameof(GetReviews), new { id = r.Id }, response);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var r = await _context.Reviews.FindAsync(id);
            if (r == null) return NotFound();

            // Get course info for audit log
            var course = await _context.Courses.FindAsync(r.CourseId);

            _context.Reviews.Remove(r);
            await _context.SaveChangesAsync();

            // Log audit trail
            var auditLog = new AuditLog
            {
                Action = "Delete",
                EntityType = "Review",
                EntityId = id,
                EntityName = course?.Title ?? $"Course {r.CourseId}",
                Description = $"Review deleted",
                UserId = r.UserId,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Review deleted successfully" });
        }
    }
}