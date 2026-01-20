using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.Enrollment;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EnrollmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EnrollmentsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<EnrollmentResponseDto>>> GetEnrollments()
        {
            var enrollments = await _context.Enrollments.ToListAsync();
            var dtos = enrollments.Select(e => new EnrollmentResponseDto { Id = e.Id, UserId = e.UserId, CourseId = e.CourseId, EnrolledAt = e.EnrolledAt }).ToList();
            return Ok(dtos);
        }

        [Authorize]
        [HttpGet("byCourse/{courseId}")]
        public async Task<ActionResult<IEnumerable<EnrollmentResponseDto>>> GetEnrollmentsByCourse(int courseId)
        {
            var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) return NotFound();
            if (course.CreatedBy != userId) return Forbid();

            var enrollments = await _context.Enrollments.Where(e => e.CourseId == courseId).Include(e => e.User).ToListAsync();
            var dtos = enrollments.Select(e => new EnrollmentResponseDto { Id = e.Id, UserId = e.UserId, CourseId = e.CourseId, EnrolledAt = e.EnrolledAt }).ToList();
            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<EnrollmentResponseDto>> GetEnrollment(int id)
        {
            var e = await _context.Enrollments.FindAsync(id);
            if (e == null) return NotFound();
            var dto = new EnrollmentResponseDto { Id = e.Id, UserId = e.UserId, CourseId = e.CourseId, EnrolledAt = e.EnrolledAt };
            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<EnrollmentResponseDto>> CreateEnrollment(CreateEnrollmentDto dto)
        {
            var e = new Enrollment { UserId = dto.UserId, CourseId = dto.CourseId };
            _context.Enrollments.Add(e);
            await _context.SaveChangesAsync();

            // Get course info for audit log
            var course = await _context.Courses.FindAsync(dto.CourseId);
            
            // Log audit trail
            var auditLog = new AuditLog
            {
                Action = "Create",
                EntityType = "Enrollment",
                EntityId = e.Id,
                EntityName = course?.Title ?? $"Course {dto.CourseId}",
                Description = $"Enrollment created for user {dto.UserId}",
                UserId = null, // API call without specific user context
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            var response = new EnrollmentResponseDto { Id = e.Id, UserId = e.UserId, CourseId = e.CourseId, EnrolledAt = e.EnrolledAt };
            return CreatedAtAction(nameof(GetEnrollment), new { id = e.Id }, response);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEnrollment(int id)
        {
            var e = await _context.Enrollments.FindAsync(id);
            if (e == null) return NotFound();

            // Get course info for audit log
            var course = await _context.Courses.FindAsync(e.CourseId);

            _context.Enrollments.Remove(e);
            await _context.SaveChangesAsync();

            // Log audit trail
            var auditLog = new AuditLog
            {
                Action = "Delete",
                EntityType = "Enrollment",
                EntityId = id,
                EntityName = course?.Title ?? $"Course {e.CourseId}",
                Description = $"Enrollment deleted for user {e.UserId}",
                UserId = null, // API call without specific user context
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Enrollment deleted successfully" });
        }
    }
}