using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.Course;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using ids.Services;
using Microsoft.AspNetCore.Hosting;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CoursesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public CoursesController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet]
        public async Task<IActionResult> GetCourses([FromQuery] string? status)
        {
            try
            {
                var query = _context.Courses
                    .Include(c => c.Creator)
                    .Include(c => c.Enrollments)
                    .AsQueryable();

                // ONLY apply status filter if explicitly provided
                if (!string.IsNullOrEmpty(status))
                {
                    if (status.ToLower() == "published")
                    {
                        query = query.Where(c => c.IsPublished == true);
                    }
                    else if (status.ToLower() == "draft")
                    {
                        query = query.Where(c => c.IsPublished == false);
                    }
                }

                var courses = await query.ToListAsync();
                
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
                    Creator = c.Creator != null ? new UserDto 
                    { 
                        Id = c.Creator.Id,
                        FullName = c.Creator.FullName,
                        Email = c.Creator.Email
                    } : null,
                    CreatedAt = c.CreatedAt,
                    IsPublished = c.IsPublished,
                    EnrollmentCount = c.Enrollments.Count()
                }).ToList();

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                ErrorLogger.Log(ex, _env);
                return StatusCode(500, new { message = "Error retrieving courses" });
            }
        }

        [Authorize]
        [HttpGet("mine")]
        public async Task<ActionResult<IEnumerable<CourseResponseDto>>> GetMyCourses()
        {
            try
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
            catch (Exception ex)
            {
                ErrorLogger.Log(ex, _env);
                return StatusCode(500, new { message = "Error retrieving your courses" });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CourseResponseDto>> GetCourse(int id)
        {
            try
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
            catch (Exception ex)
            {
                ErrorLogger.Log(ex, _env);
                return StatusCode(500, new { message = "Error retrieving course" });
            }
        }

        [Authorize(Roles = "Instructor,Admin")]
        [HttpPost]
        public async Task<ActionResult<CourseResponseDto>> CreateCourse(CreateCourseDto dto)
        {
            try
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

                // Log the creation
                var auditLog = new AuditLog
                {
                    Action = "Create",
                    EntityType = "Course",
                    EntityId = course.Id,
                    EntityName = course.Title,
                    Description = $"Course '{course.Title}' has been created",
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AuditLogs.Add(auditLog);
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
            catch (Exception ex)
            {
                ErrorLogger.Log(ex, _env);
                return StatusCode(500, new { message = "Error creating course" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCourse(int id, UpdateCourseDto dto)
        {
            try
            {
                var course = await _context.Courses.FindAsync(id);
                if (course == null) return NotFound();

                var previousTitle = course.Title;
                course.Title = dto.Title ?? course.Title;
                course.ShortDescription = dto.ShortDescription ?? course.ShortDescription;
                course.LongDescription = dto.LongDescription ?? course.LongDescription;
                course.Category = dto.Category ?? course.Category;
                course.Difficulty = dto.Difficulty ?? course.Difficulty;
                course.Thumbnail = dto.Thumbnail ?? course.Thumbnail;
                if (dto.IsPublished.HasValue) course.IsPublished = dto.IsPublished.Value;

                await _context.SaveChangesAsync();

                // Log the update
                var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                int? userId = null;
                if (int.TryParse(sub, out var parsedId))
                {
                    userId = parsedId;
                }

                var auditLog = new AuditLog
                {
                    Action = "Update",
                    EntityType = "Course",
                    EntityId = course.Id,
                    EntityName = course.Title,
                    Description = $"Course '{previousTitle}' has been updated to '{course.Title}'",
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                ErrorLogger.Log(ex, _env);
                return StatusCode(500, new { message = "Error updating course" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            try
            {
                var course = await _context.Courses.FindAsync(id);
                if (course == null) return NotFound();

                // Extract user ID from JWT
                var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                int.TryParse(sub, out var userId);

                // Log the deletion
                var auditLog = new AuditLog
                {
                    Action = "Delete",
                    EntityType = "Course",
                    EntityId = course.Id,
                    EntityName = course.Title,
                    Description = $"Course '{course.Title}' has been deleted",
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AuditLogs.Add(auditLog);

                _context.Courses.Remove(course);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Course deleted successfully" });
            }
            catch (Exception ex)
            {
                ErrorLogger.Log(ex, _env);
                return StatusCode(500, new { message = "Error deleting course" });
            }
        }
    }
}