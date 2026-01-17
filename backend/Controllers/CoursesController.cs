using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.Course;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CoursesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CoursesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseResponseDto>>> GetCourses()
        {
            var courses = await _context.Courses.ToListAsync();
            var dtos = courses.Select(c => new CourseResponseDto
            {
                Id = c.Id,
                Title = c.Title,
                ShortDescription = c.ShortDescription,
                LongDescription = c.LongDescription,
                Category = c.Category,
                Difficulty = c.Difficulty,
                Thumbnail = c.Thumbnail,
                CreatedBy = c.CreatedBy,
                CreatedAt = c.CreatedAt,
                IsPublished = c.IsPublished
            }).ToList();

            return Ok(dtos);
        }

        [Authorize]
        [HttpGet("mine")]
        public async Task<ActionResult<IEnumerable<CourseResponseDto>>> GetMyCourses()
        {
            // Get user id from JWT subject
            var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var courses = await _context.Courses.Where(c => c.CreatedBy == userId).ToListAsync();
            var dtos = courses.Select(c => new CourseResponseDto
            {
                Id = c.Id,
                Title = c.Title,
                ShortDescription = c.ShortDescription,
                LongDescription = c.LongDescription,
                Category = c.Category,
                Difficulty = c.Difficulty,
                Thumbnail = c.Thumbnail,
                CreatedBy = c.CreatedBy,
                CreatedAt = c.CreatedAt,
                IsPublished = c.IsPublished
            }).ToList();

            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CourseResponseDto>> GetCourse(int id)
        {
            var c = await _context.Courses.FindAsync(id);
            if (c == null) return NotFound();

            var dto = new CourseResponseDto
            {
                Id = c.Id,
                Title = c.Title,
                ShortDescription = c.ShortDescription,
                LongDescription = c.LongDescription,
                Category = c.Category,
                Difficulty = c.Difficulty,
                Thumbnail = c.Thumbnail,
                CreatedBy = c.CreatedBy,
                CreatedAt = c.CreatedAt,
                IsPublished = c.IsPublished
            };

            return Ok(dto);
        }

        [Authorize(Roles = "Instructor,Admin")]
        [HttpPost]
        public async Task<ActionResult<CourseResponseDto>> CreateCourse(CreateCourseDto dto)
        {
            // Set CreatedBy from the authenticated user (ignore any client-supplied value)
            var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var course = new Course
            {
                Title = dto.Title,
                ShortDescription = dto.ShortDescription,
                LongDescription = dto.LongDescription,
                Category = dto.Category,
                Difficulty = dto.Difficulty,
                Thumbnail = dto.Thumbnail,
                CreatedBy = userId,
                IsPublished = dto.IsPublished
            };

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            var response = new CourseResponseDto
            {
                Id = course.Id,
                Title = course.Title,
                ShortDescription = course.ShortDescription,
                LongDescription = course.LongDescription,
                Category = course.Category,
                Difficulty = course.Difficulty,
                Thumbnail = course.Thumbnail,
                CreatedBy = course.CreatedBy,
                CreatedAt = course.CreatedAt,
                IsPublished = course.IsPublished
            };

            return CreatedAtAction(nameof(GetCourse), new { id = course.Id }, response);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCourse(int id, UpdateCourseDto dto)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return NotFound();

            course.Title = dto.Title ?? course.Title;
            course.ShortDescription = dto.ShortDescription ?? course.ShortDescription;
            course.LongDescription = dto.LongDescription ?? course.LongDescription;
            course.Category = dto.Category ?? course.Category;
            course.Difficulty = dto.Difficulty ?? course.Difficulty;
            course.Thumbnail = dto.Thumbnail ?? course.Thumbnail;
            if (dto.IsPublished.HasValue) course.IsPublished = dto.IsPublished.Value;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return NotFound();

            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Course deleted successfully" });
        }
    }
}