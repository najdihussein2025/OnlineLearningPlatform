using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.Enrollment;

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
            var response = new EnrollmentResponseDto { Id = e.Id, UserId = e.UserId, CourseId = e.CourseId, EnrolledAt = e.EnrolledAt };
            return CreatedAtAction(nameof(GetEnrollment), new { id = e.Id }, response);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEnrollment(int id)
        {
            var e = await _context.Enrollments.FindAsync(id);
            if (e == null) return NotFound();

            _context.Enrollments.Remove(e);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Enrollment deleted successfully" });
        }
    }
}