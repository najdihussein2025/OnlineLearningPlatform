using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
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
        private readonly PasswordHasher<User> _passwordHasher;

        public UsersController(AppDbContext context)
        {
            _context = context;
            _passwordHasher = new PasswordHasher<User>();
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            return Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(password)));
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetUsers([FromQuery] string? role, [FromQuery] string? status)
        {
            // Always exclude Admin users from the list
            var query = _context.Users.Where(u => u.Role != "Admin");

            // Apply role filter if provided
            if (!string.IsNullOrEmpty(role) && role.ToLower() != "all")
            {
                query = query.Where(u => u.Role.ToLower() == role.ToLower());
            }

            // Apply status filter if provided
            if (!string.IsNullOrEmpty(status) && status.ToLower() != "all")
            {
                query = query.Where(u => u.Status.ToLower() == status.ToLower());
            }

            var users = await query
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
                Status = user.Status,
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
                Role = dto.Role,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, new UserResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                Status = user.Status,
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

        [HttpPut("{id}/status")]
        public async Task<IActionResult> ChangeStatus(int id, [FromBody] ChangeStatusDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound();

            // Prevent changing Admin status
            if (user.Role == "Admin")
                return Forbid("Cannot change status of Admin users");

            if (string.IsNullOrEmpty(dto.Status))
                return BadRequest(new { message = "Status is required" });

            var previousStatus = user.Status;
            user.Status = dto.Status;
            await _context.SaveChangesAsync();

            // Log the status change
            var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            int.TryParse(sub, out var userId);

            var auditLog = new AuditLog
            {
                Action = "Update",
                EntityType = "User",
                EntityId = user.Id,
                EntityName = user.FullName ?? user.Email,
                Description = $"User status changed from '{previousStatus}' to '{dto.Status}'",
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User status updated successfully" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound();

            // Prevent deleting Admin users
            if (user.Role == "Admin")
                return Forbid("Cannot delete Admin users");

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

        [HttpPut("change-password")]
        [Authorize]
        public async Task<ActionResult> ChangePassword(ChangePasswordDto dto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                if (string.IsNullOrWhiteSpace(dto?.CurrentPassword))
                {
                    return BadRequest(new { message = "Current password is required" });
                }

                if (string.IsNullOrWhiteSpace(dto?.NewPassword))
                {
                    return BadRequest(new { message = "New password is required" });
                }

                if (dto.NewPassword.Length < 8)
                {
                    return BadRequest(new { message = "New password must be at least 8 characters long" });
                }

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Verify current password
                var passwordVerificationResult = _passwordHasher.VerifyHashedPassword(user: null, user.HashedPassword, dto.CurrentPassword);
                
                // Also check SHA256 fallback for backward compatibility
                bool passwordValid = false;
                if (passwordVerificationResult == PasswordVerificationResult.Success || 
                    passwordVerificationResult == PasswordVerificationResult.SuccessRehashNeeded)
                {
                    passwordValid = true;
                }
                else
                {
                    // Fallback to SHA256 for backward compatibility
                    using var sha256 = SHA256.Create();
                    var hashed = Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(dto.CurrentPassword)));
                    if (user.HashedPassword == hashed)
                    {
                        passwordValid = true;
                    }
                }

                if (!passwordValid)
                {
                    return Unauthorized(new { message = "Current password is incorrect" });
                }

                // Hash and save new password
                user.HashedPassword = _passwordHasher.HashPassword(user: null, dto.NewPassword);
                await _context.SaveChangesAsync();

                // Log audit trail
                var auditLog = new AuditLog
                {
                    Action = "Update",
                    EntityType = "Password",
                    EntityId = userId,
                    EntityName = user.FullName,
                    Description = $"User changed password",
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while changing password", error = ex.Message });
            }
        }
    }
}
