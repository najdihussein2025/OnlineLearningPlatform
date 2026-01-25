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

        public async Task JoinConversationRoom(int conversationId)
        {
            var userIdClaim = Context.User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("User not authenticated");
            }

            var conv = await _context.Conversations.FindAsync(conversationId);
            if (conv == null)
            {
                throw new UnauthorizedAccessException("Conversation not found");
            }

            if (conv.StudentId != userId && conv.InstructorId != userId)
            {
                throw new UnauthorizedAccessException("Not authorized for this conversation");
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation-{conversationId}");
            await Clients.Group($"conversation-{conversationId}").SendAsync("UserJoined", userId);
        }

        public async Task SendMessage(int conversationId, string content)
        {
            var userIdClaim = Context.User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var senderId))
            {
                throw new UnauthorizedAccessException("User not authenticated");
            }

            var conv = await _context.Conversations.FindAsync(conversationId);
            if (conv == null)
            {
                throw new UnauthorizedAccessException("Conversation not found");
            }

            if (conv.StudentId != senderId && conv.InstructorId != senderId)
            {
                throw new UnauthorizedAccessException("Not authorized for this conversation");
            }

            var msg = new Message
            {
                ConversationId = conversationId,
                SenderId = senderId,
                Content = content ?? string.Empty,
                SentAt = DateTime.UtcNow
            };

            _context.Messages.Add(msg);
            await _context.SaveChangesAsync();

            var sender = await _context.Users.FindAsync(senderId);
            var senderName = sender?.FullName ?? "Unknown";

            await Clients.Group($"conversation-{conversationId}").SendAsync("ReceiveMessage", new
            {
                id = msg.Id,
                conversationId = conversationId,
                senderId = senderId,
                senderName = senderName,
                content = msg.Content,
                sentAt = msg.SentAt
            });
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }
}
