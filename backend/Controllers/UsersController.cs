using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.User;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            return Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(password)));
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new UserResponseDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    Role = u.Role,
                    Status = u.Status,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserResponseDto>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound();

            return Ok(new UserResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            });
        }

        [HttpPost]
        public async Task<ActionResult<UserResponseDto>> CreateUser(CreateUserDto dto)
        {
            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                HashedPassword = HashPassword(dto.Password),
                Role = dto.Role
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, new UserResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound();

            var previousStatus = user.Status;
            var previousRole = user.Role;
            var previousName = user.FullName;

            user.FullName = dto.FullName ?? user.FullName;
            user.Role = dto.Role ?? user.Role;
            user.Status = dto.Status ?? user.Status;

            await _context.SaveChangesAsync();

            // Log changes if status was modified
            if (dto.Status != null && previousStatus != user.Status)
            {
                var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                int.TryParse(sub, out var userId);

                var auditLog = new AuditLog
                {
                    Action = "Update",
                    EntityType = "User",
                    EntityId = user.Id,
                    EntityName = user.FullName ?? user.Email,
                    Description = $"User status changed from '{previousStatus}' to '{user.Status}'",
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound();

            // Extract user ID from JWT for audit logging
            var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            int.TryParse(sub, out var userId);

            // Log the deletion
            var auditLog = new AuditLog
            {
                Action = "Delete",
                EntityType = "User",
                EntityId = user.Id,
                EntityName = user.FullName ?? user.Email,
                Description = $"User '{user.FullName ?? user.Email}' has been deleted",
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User deleted successfully" });
        }
    }
}
