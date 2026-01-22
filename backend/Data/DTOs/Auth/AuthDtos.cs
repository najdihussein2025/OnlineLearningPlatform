using ids.Data.DTOs.User;

namespace ids.Data.DTOs.Auth
{
    public class LoginDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class RegisterDto
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string ConfirmPassword { get; set; }
    }

    public class AuthResponseDto
    {
        public string Token { get; set; }
        public UserResponseDto User { get; set; }
        public bool Requires2FA { get; set; }
        public int? AdminId { get; set; }
    }

    public class Verify2FADto
    {
        public string Code { get; set; }
    }
}
