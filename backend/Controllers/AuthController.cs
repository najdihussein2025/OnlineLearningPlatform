using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.User;
using ids.Data.DTOs.Auth;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using ids.Services;
using Microsoft.AspNetCore.Http;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly PasswordHasher<User> _passwordHasher;
        private readonly IEmailService _emailService;

        public AuthController(AppDbContext context, IConfiguration config, IEmailService emailService)
        {
            _context = context;
            _config = config;
            _passwordHasher = new PasswordHasher<User>();
            _emailService = emailService;
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            return Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(password)));
        }

        private string CreateToken(User user)
        {
            var jwt = _config.GetSection("Jwt");
            var key = jwt["Key"] ?? "dev_secret_replace_with_env_or_user_secrets_change_me";
            var issuer = jwt["Issuer"] ?? "OnlineLearningPlatform";
            var audience = jwt["Audience"] ?? "OnlineLearningPlatformAudience";
            var expiresInMinutes = int.TryParse(jwt["ExpiresInMinutes"], out var m) ? m : 60;

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                // Use role as stored in database (default to "Student" if missing)
                new Claim(ClaimTypes.Role, user.Role ?? "Student"),
            };

            var keyBytes = Encoding.UTF8.GetBytes(key);
            var creds = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiresInMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [HttpPost("register")]
        public async Task<ActionResult> Register(RegisterDto dto)
        {
            // Validation: Email is required and valid
            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "Email is required" });
            }

            if (!IsValidEmail(dto.Email))
            {
                return BadRequest(new { message = "Email is not valid" });
            }

            // Validation: Email must be unique
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return Conflict(new { message = "Email already exists" });
            }

            // Validation: FullName is required
            if (string.IsNullOrWhiteSpace(dto.FullName))
            {
                return BadRequest(new { message = "Full name is required" });
            }

            // Validation: Password requirements
            var passwordValidation = ValidatePassword(dto.Password);
            if (!passwordValidation.IsValid)
            {
                return BadRequest(new { message = passwordValidation.ErrorMessage });
            }

            // Validation: ConfirmPassword must match Password
            if (dto.Password != dto.ConfirmPassword)
            {
                return BadRequest(new { message = "Password and confirm password do not match" });
            }

            // Create user - Role is ALWAYS "Student" for new registrations
            // Role cannot be set from frontend and is never accepted from RegisterDto
            var user = new User
            {
                FullName = dto.FullName.Trim(),
                Email = dto.Email.Trim().ToLowerInvariant(),
                HashedPassword = _passwordHasher.HashPassword(user: null, password: dto.Password),
                Role = "Student" // Always "Student" - never accept role from frontend
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Registration successful" });
        }

        private bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            try
            {
                var emailRegex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase);
                return emailRegex.IsMatch(email);
            }
            catch
            {
                return false;
            }
        }

        private (bool IsValid, string ErrorMessage) ValidatePassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
            {
                return (false, "Password is required");
            }

            if (password.Length < 8)
            {
                return (false, "Password must be at least 8 characters long");
            }

            if (!password.Any(char.IsUpper))
            {
                return (false, "Password must contain at least one uppercase letter");
            }

            if (!password.Any(char.IsDigit))
            {
                return (false, "Password must contain at least one number");
            }

            return (true, null);
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<UserResponseDto>> Me()
        {
            var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var u = await _context.Users.FindAsync(userId);
            if (u == null) return NotFound();

            var dto = new UserResponseDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = (u.Role ?? "student").ToLowerInvariant(),
                CreatedAt = u.CreatedAt
            };

            return Ok(dto);
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
        {
            // Only allow login for users with Active status (case-insensitive check)
            var user = await _context.Users.SingleOrDefaultAsync(u => 
                u.Email == dto.Email && 
                u.Status.ToLower() == "active");
            
            if (user == null)
            {
                // Check if user exists but is inactive
                var inactiveUser = await _context.Users.SingleOrDefaultAsync(u => u.Email == dto.Email);
                if (inactiveUser != null && inactiveUser.Status.ToLower() != "active")
                {
                    return Unauthorized(new { message = "Account is disabled" });
                }
                return Unauthorized(new { message = "Invalid credentials" });
            }

            // Try PasswordHasher first (for new users), fallback to SHA256 (for existing users)
            bool passwordValid = false;
            var passwordHasherResult = _passwordHasher.VerifyHashedPassword(user: null, user.HashedPassword, dto.Password);
            
            if (passwordHasherResult == PasswordVerificationResult.Success || 
                passwordHasherResult == PasswordVerificationResult.SuccessRehashNeeded)
            {
                passwordValid = true;
                // Rehash if needed (upgrade from old hash)
                if (passwordHasherResult == PasswordVerificationResult.SuccessRehashNeeded)
                {
                    user.HashedPassword = _passwordHasher.HashPassword(user: null, dto.Password);
                    await _context.SaveChangesAsync();
                }
            }
            else
            {
                // Fallback to SHA256 for backward compatibility with existing users
                var hashed = HashPassword(dto.Password);
                if (user.HashedPassword == hashed)
                {
                    passwordValid = true;
                    // Upgrade to PasswordHasher
                    user.HashedPassword = _passwordHasher.HashPassword(user: null, dto.Password);
                    await _context.SaveChangesAsync();
                }
            }

            if (!passwordValid)
                return Unauthorized(new { message = "Invalid credentials" });

            // Check if user is admin - if so, require 2FA
            var isAdmin = (user.Role ?? "").ToLowerInvariant() == "admin";
            
            if (isAdmin)
            {
                // Generate 6-digit code
                var random = new Random();
                var code = random.Next(100000, 999999).ToString();

                // Save code to database with 5 minute expiry
                var twoFACode = new Admin2FACode
                {
                    AdminId = user.Id,
                    Code = code,
                    Expiry = DateTime.UtcNow.AddMinutes(5),
                    IsUsed = false
                };

                _context.Admin2FACodes.Add(twoFACode);
                await _context.SaveChangesAsync();

                // Send email with code
                try
                {
                    await _emailService.Send2FACodeAsync(user.Email, code);
                }
                catch (Exception ex)
                {
                    // Log error but don't fail the request - code is still saved
                    // In production, you might want to handle this differently
                    Console.WriteLine($"Error sending 2FA email: {ex.Message}");
                }

                // Store in session for 2FA verification (DO NOT issue JWT)
                HttpContext.Session.SetString("TwoFactorUserId", user.Id.ToString());
                HttpContext.Session.SetString("TwoFactorExpiry", (DateTime.UtcNow.AddMinutes(10)).ToString("O"));

                // Return 2FA required response (DO NOT issue JWT)
                return Ok(new AuthResponseDto 
                { 
                    Requires2FA = true, 
                    AdminId = null, // Don't return adminId to frontend
                    Token = null,
                    User = null
                });
            }

            // Non-admin users: proceed with normal login
            var token = CreateToken(user);

            var userDto = new UserResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = (user.Role ?? "student").ToLowerInvariant(),
                CreatedAt = user.CreatedAt
            };

            return Ok(new AuthResponseDto { Token = token, User = userDto });
        }

        [HttpPost("verify-2fa")]
        public async Task<ActionResult<AuthResponseDto>> Verify2FA(Verify2FADto dto)
        {
            // Read userId from session (NOT from request body)
            var userIdStr = HttpContext.Session.GetString("TwoFactorUserId");
            var expiryStr = HttpContext.Session.GetString("TwoFactorExpiry");

            // Check if session exists and is valid
            if (string.IsNullOrEmpty(userIdStr) || string.IsNullOrEmpty(expiryStr))
            {
                return Unauthorized(new { message = "Session expired. Please login again." });
            }

            // Parse userId
            if (!int.TryParse(userIdStr, out var userId))
            {
                return Unauthorized(new { message = "Invalid session. Please login again." });
            }

            // Check if session has expired
            if (DateTime.TryParse(expiryStr, out var expiry) && expiry < DateTime.UtcNow)
            {
                // Clear session
                HttpContext.Session.Remove("TwoFactorUserId");
                HttpContext.Session.Remove("TwoFactorExpiry");
                return Unauthorized(new { message = "Session expired. Please login again." });
            }

            // Find the code using userId from session
            var codeEntry = await _context.Admin2FACodes
                .FirstOrDefaultAsync(c => 
                    c.AdminId == userId && 
                    c.Code == dto.Code && 
                    !c.IsUsed &&
                    c.Expiry > DateTime.UtcNow);

            if (codeEntry == null)
            {
                return Unauthorized(new { message = "Invalid or expired code" });
            }

            // Mark code as used
            codeEntry.IsUsed = true;
            await _context.SaveChangesAsync();

            // Get admin user
            var admin = await _context.Users.FindAsync(userId);
            if (admin == null || (admin.Role ?? "").ToLowerInvariant() != "admin")
            {
                return Unauthorized(new { message = "Invalid admin account" });
            }

            // Clear 2FA session
            HttpContext.Session.Remove("TwoFactorUserId");
            HttpContext.Session.Remove("TwoFactorExpiry");

            // Now create the real login (JWT token)
            var token = CreateToken(admin);

            var userDto = new UserResponseDto
            {
                Id = admin.Id,
                FullName = admin.FullName,
                Email = admin.Email,
                Role = (admin.Role ?? "admin").ToLowerInvariant(),
                CreatedAt = admin.CreatedAt
            };

            return Ok(new AuthResponseDto { Token = token, User = userDto });
        }
    }
}
