using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using ids.Data;
using ids.Models;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ChatController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("messages/{courseId}")]
        public async Task<IActionResult> GetMessages(int courseId)
        {
            var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(sub, out var userId))
            {
                return Unauthorized();
            }

            // Verify user has access to this course
            bool isInstructor = await _context.Courses
                .AnyAsync(c => c.Id == courseId && c.CreatedBy == userId);

            bool isStudent = await _context.Enrollments
                .AnyAsync(e => e.CourseId == courseId && e.UserId == userId);

            if (!isInstructor && !isStudent)
            {
                return Forbid("Not authorized for this course chat");
            }

            // Get all messages for this course
            var messages = await _context.ChatMessages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Where(m => m.CourseId == courseId)
                .OrderBy(m => m.SentAt)
                .Select(m => new
                {
                    id = m.Id,
                    courseId = m.CourseId,
                    senderId = m.SenderId,
                    senderName = m.Sender.FullName,
                    receiverId = m.ReceiverId,
                    receiverName = m.Receiver.FullName,
                    message = m.Message,
                    sentAt = m.SentAt
                })
                .ToListAsync();

            return Ok(messages);
        }

        [HttpGet("verify/{courseId}")]
        public async Task<IActionResult> VerifyAccess(int courseId)
        {
            var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(sub, out var userId))
            {
                return Unauthorized();
            }

            // Check if user is instructor
            bool isInstructor = await _context.Courses
                .AnyAsync(c => c.Id == courseId && c.CreatedBy == userId);

            // Check if user is enrolled student
            bool isStudent = await _context.Enrollments
                .AnyAsync(e => e.CourseId == courseId && e.UserId == userId);

            if (!isInstructor && !isStudent)
            {
                return Forbid("Not authorized for this course chat");
            }

            // Get the other party (instructor if student, or enrolled students if instructor)
            if (isStudent)
            {
                var course = await _context.Courses
                    .Include(c => c.Creator)
                    .FirstOrDefaultAsync(c => c.Id == courseId);
                
                if (course == null)
                {
                    return NotFound();
                }

                return Ok(new
                {
                    hasAccess = true,
                    role = "student",
                    otherPartyId = course.CreatedBy,
                    otherPartyName = course.Creator.FullName,
                    courseTitle = course.Title
                });
            }
            else // isInstructor
            {
                // For instructor, we'll return the first enrolled student or null
                // In the UI, instructor can select which student to chat with
                var enrolledStudents = await _context.Enrollments
                    .Include(e => e.User)
                    .Where(e => e.CourseId == courseId)
                    .Select(e => new
                    {
                        id = e.UserId,
                        name = e.User.FullName
                    })
                    .ToListAsync();

                var course = await _context.Courses.FindAsync(courseId);

                return Ok(new
                {
                    hasAccess = true,
                    role = "instructor",
                    enrolledStudents = enrolledStudents,
                    courseTitle = course?.Title
                });
            }
        }
    }
}

