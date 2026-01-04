using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.User;
using ids.Data.DTOs.Auth;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
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
                // Default role to 'student' when missing so UI and authorization behave consistently
                new Claim(ClaimTypes.Role, (user.Role ?? "student").ToLowerInvariant()),
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
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest(new { message = "Email already in use" });

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                HashedPassword = HashPassword(dto.Password),
                // store normalized lowercase role
                Role = (dto.Role ?? "student").ToLowerInvariant()
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

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
            var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
                return Unauthorized(new { message = "Invalid credentials" });

            var hashed = HashPassword(dto.Password);
            if (user.HashedPassword != hashed)
                return Unauthorized(new { message = "Invalid credentials" });

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
    }
}
