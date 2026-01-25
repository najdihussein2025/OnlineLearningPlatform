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

        /// <summary>
        /// Get all conversations for the current user.
        /// Student: returns conversations with instructors (otherParty = instructor).
        /// Instructor: returns conversations with students (otherParty = student).
        /// </summary>
        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(sub, out var userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return Unauthorized();

            var role = user.Role?.ToLower() ?? "student";

            if (role == "student")
            {
                var list = await _context.Conversations
                    .Include(c => c.Instructor)
                    .Where(c => c.StudentId == userId)
                    .OrderByDescending(c => c.CreatedAt)
                    .Select(c => new
                    {
                        id = c.Id,
                        otherPartyId = c.InstructorId,
                        otherPartyName = c.Instructor.FullName,
                        otherPartyEmail = c.Instructor.Email,
                        createdAt = c.CreatedAt
                    })
                    .ToListAsync();
                return Ok(list);
            }

            if (role == "instructor")
            {
                var list = await _context.Conversations
                    .Include(c => c.Student)
                    .Where(c => c.InstructorId == userId)
                    .OrderByDescending(c => c.CreatedAt)
                    .Select(c => new
                    {
                        id = c.Id,
                        otherPartyId = c.StudentId,
                        otherPartyName = c.Student.FullName,
                        otherPartyEmail = c.Student.Email,
                        createdAt = c.CreatedAt
                    })
                    .ToListAsync();
                return Ok(list);
            }

            return Ok(new List<object>());
        }

        /// <summary>
        /// Get users that the current user can start a conversation with (instructors for students, students for instructors).
        /// Excludes users with whom a conversation already exists.
        /// </summary>
        [HttpGet("conversations/available-partners")]
        public async Task<IActionResult> GetAvailablePartners()
        {
            var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(sub, out var userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return Unauthorized();

            var role = user.Role?.ToLower() ?? "student";
            var existingConversationPartnerIds = await _context.Conversations
                .Where(c => c.StudentId == userId || c.InstructorId == userId)
                .Select(c => c.StudentId == userId ? c.InstructorId : c.StudentId)
                .ToListAsync();

            if (role == "student")
            {
                var instructorIds = await _context.Enrollments
                    .Where(e => e.UserId == userId)
                    .Select(e => e.Course.CreatedBy)
                    .Distinct()
                    .ToListAsync();
                var available = await _context.Users
                    .Where(u => instructorIds.Contains(u.Id) && !existingConversationPartnerIds.Contains(u.Id))
                    .Select(u => new { id = u.Id, fullName = u.FullName, email = u.Email })
                    .ToListAsync();
                return Ok(available);
            }

            if (role == "instructor")
            {
                var studentIds = await _context.Enrollments
                    .Where(e => e.Course.CreatedBy == userId)
                    .Select(e => e.UserId)
                    .Distinct()
                    .ToListAsync();
                var available = await _context.Users
                    .Where(u => studentIds.Contains(u.Id) && !existingConversationPartnerIds.Contains(u.Id))
                    .Select(u => new { id = u.Id, fullName = u.FullName, email = u.Email })
                    .ToListAsync();
                return Ok(available);
            }

            return Ok(new List<object>());
        }

        /// <summary>
        /// Get or create a conversation with another user.
        /// Student must pass instructorId; instructor must pass studentId.
        /// Returns the conversation (creates it if it does not exist).
        /// </summary>
        [HttpPost("conversations/with/{otherUserId:int}")]
        public async Task<IActionResult> GetOrCreateConversation(int otherUserId)
        {
            var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(sub, out var userId))
            {
                return Unauthorized();
            }

            var me = await _context.Users.FindAsync(userId);
            var other = await _context.Users.FindAsync(otherUserId);
            if (me == null || other == null)
            {
                return NotFound("User not found");
            }

            var myRole = me.Role?.ToLower() ?? "student";
            var otherRole = other.Role?.ToLower() ?? "student";

            int studentId, instructorId;
            if (myRole == "student" && otherRole == "instructor")
            {
                studentId = userId;
                instructorId = otherUserId;
            }
            else if (myRole == "instructor" && otherRole == "student")
            {
                studentId = otherUserId;
                instructorId = userId;
            }
            else
            {
                return BadRequest("Conversation is only between a student and an instructor.");
            }

            var conv = await _context.Conversations
                .Include(c => c.Student)
                .Include(c => c.Instructor)
                .FirstOrDefaultAsync(c => c.StudentId == studentId && c.InstructorId == instructorId);

            if (conv == null)
            {
                conv = new Conversation
                {
                    StudentId = studentId,
                    InstructorId = instructorId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Conversations.Add(conv);
                await _context.SaveChangesAsync();
                await _context.Entry(conv).Reference(c => c.Student).LoadAsync();
                await _context.Entry(conv).Reference(c => c.Instructor).LoadAsync();
            }

            var otherParty = conv.StudentId == userId ? conv.Instructor : conv.Student;
            return Ok(new
            {
                id = conv.Id,
                otherPartyId = otherParty.Id,
                otherPartyName = otherParty.FullName,
                otherPartyEmail = otherParty.Email,
                createdAt = conv.CreatedAt
            });
        }

        /// <summary>
        /// Get messages for a conversation. User must be the student or instructor of that conversation.
        /// </summary>
        [HttpGet("messages/{conversationId:int}")]
        public async Task<IActionResult> GetMessages(int conversationId)
        {
            var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(sub, out var userId))
            {
                return Unauthorized();
            }

            var conv = await _context.Conversations.FindAsync(conversationId);
            if (conv == null)
            {
                return NotFound("Conversation not found");
            }

            if (conv.StudentId != userId && conv.InstructorId != userId)
            {
                return Forbid("You are not part of this conversation.");
            }

            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Where(m => m.ConversationId == conversationId)
                .OrderBy(m => m.SentAt)
                .Select(m => new
                {
                    id = m.Id,
                    conversationId = m.ConversationId,
                    senderId = m.SenderId,
                    senderName = m.Sender.FullName,
                    content = m.Content,
                    sentAt = m.SentAt
                })
                .ToListAsync();

            return Ok(messages);
        }
    }
}
