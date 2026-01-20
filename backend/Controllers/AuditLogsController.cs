using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Models;
using ids.Data.DTOs;
using System.Security.Claims;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditLogsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuditLogsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetAuditLogs([FromQuery] int limit = 50)
        {
            var logs = await _context.AuditLogs
                .Include(a => a.User)
                .OrderByDescending(a => a.CreatedAt)
                .Take(limit)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    Action = a.Action,
                    EntityType = a.EntityType,
                    EntityId = a.EntityId,
                    EntityName = a.EntityName,
                    Description = a.Description,
                    UserName = a.User != null ? (a.User.FullName ?? a.User.Email) : "System",
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();

            return Ok(logs);
        }

        [HttpGet("byEntity/{entityType}/{entityId}")]
        public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetAuditLogsByEntity(string entityType, int entityId)
        {
            var logs = await _context.AuditLogs
                .Include(a => a.User)
                .Where(a => a.EntityType == entityType && a.EntityId == entityId)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    Action = a.Action,
                    EntityType = a.EntityType,
                    EntityId = a.EntityId,
                    EntityName = a.EntityName,
                    Description = a.Description,
                    UserName = a.User != null ? (a.User.FullName ?? a.User.Email) : "System",
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();

            return Ok(logs);
        }

        [HttpPost("log")]
        public async Task<ActionResult> LogAction([FromBody] LogActionRequest request)
        {
            var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub) 
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            int? userId = null;
            if (int.TryParse(sub, out var parsedId))
            {
                userId = parsedId;
            }

            var log = new AuditLog
            {
                Action = request.Action,
                EntityType = request.EntityType,
                EntityId = request.EntityId,
                EntityName = request.EntityName,
                Description = request.Description,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok();
        }
    }

    public class LogActionRequest
    {
        public string Action { get; set; } // Create, Update, Delete
        public string EntityType { get; set; } // Quiz, Course, etc.
        public int EntityId { get; set; }
        public string EntityName { get; set; }
        public string Description { get; set; }
    }
}
