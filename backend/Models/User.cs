using System;

namespace ids.Models
{
    public class User
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string HashedPassword { get; set; }
        public string Role { get; set; }
        public string Status { get; set; } = "active"; // active, inactive, pending
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
