using System.Security.Cryptography;
using System.Text;

namespace ids.Services
{
    public static class PasswordHasher
    {
        public static string Hash(string password)
        {
            using var sha256 = SHA256.Create();
            return Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(password ?? string.Empty)));
        }

        public static bool Verify(string password, string hashed)
        {
            if (password == null && hashed == null) return true;
            if (password == null || hashed == null) return false;
            return Hash(password) == hashed;
        }
    }
}
