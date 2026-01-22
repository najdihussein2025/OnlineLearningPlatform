using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using ids.Data;
using ids.Models;

namespace ids.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly AppDbContext _context;

        public ChatHub(AppDbContext context)
        {
            _context = context;
        }

        public async Task JoinCourseRoom(int courseId)
        {
            var userIdClaim = Context.User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("User not authenticated");
            }

            // Check if user is allowed in this course
            bool isInstructor = _context.Courses
                .Any(c => c.Id == courseId && c.CreatedBy == userId);

            bool isStudent = _context.Enrollments
                .Any(e => e.CourseId == courseId && e.UserId == userId);

            if (!isInstructor && !isStudent)
            {
                throw new UnauthorizedAccessException("Not authorized for this course chat");
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, $"course-{courseId}");
            await Clients.Group($"course-{courseId}").SendAsync("UserJoined", userId);
        }

        public async Task SendMessage(int courseId, int receiverId, string message)
        {
            var userIdClaim = Context.User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var senderId))
            {
                throw new UnauthorizedAccessException("User not authenticated");
            }

            // Verify user has access to this course
            bool isInstructor = _context.Courses
                .Any(c => c.Id == courseId && c.CreatedBy == senderId);

            bool isStudent = _context.Enrollments
                .Any(e => e.CourseId == courseId && e.UserId == senderId);

            if (!isInstructor && !isStudent)
            {
                throw new UnauthorizedAccessException("Not authorized for this course chat");
            }

            // Verify receiver is valid (either instructor or enrolled student)
            bool receiverIsInstructor = _context.Courses
                .Any(c => c.Id == courseId && c.CreatedBy == receiverId);
            
            bool receiverIsStudent = _context.Enrollments
                .Any(e => e.CourseId == courseId && e.UserId == receiverId);

            if (!receiverIsInstructor && !receiverIsStudent)
            {
                throw new UnauthorizedAccessException("Invalid receiver for this course");
            }

            // Ensure student can only message instructor and vice versa
            if (isStudent && !receiverIsInstructor)
            {
                throw new UnauthorizedAccessException("Students can only message the course instructor");
            }

            if (isInstructor && !receiverIsStudent)
            {
                throw new UnauthorizedAccessException("Instructors can only message enrolled students");
            }

            // Save message to database
            var chatMessage = new ChatMessage
            {
                CourseId = courseId,
                SenderId = senderId,
                ReceiverId = receiverId,
                Message = message,
                SentAt = DateTime.UtcNow
            };

            _context.ChatMessages.Add(chatMessage);
            await _context.SaveChangesAsync();

            // Get sender name for display
            var sender = await _context.Users.FindAsync(senderId);
            var senderName = sender?.FullName ?? "Unknown";

            // Send message to all users in the course room
            await Clients.Group($"course-{courseId}").SendAsync("ReceiveMessage", new
            {
                id = chatMessage.Id,
                courseId = courseId,
                senderId = senderId,
                senderName = senderName,
                receiverId = receiverId,
                message = message,
                sentAt = chatMessage.SentAt
            });
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }
}

