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
        public string Role { get; set; }
    }

    public class AuthResponseDto
    {
        public string Token { get; set; }
        public UserResponseDto User { get; set; }
    }
}
