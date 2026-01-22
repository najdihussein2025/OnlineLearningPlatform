using System;

namespace ids.Models
{
    public class Admin2FACode
    {
        public int Id { get; set; }
        public int AdminId { get; set; }
        public string Code { get; set; }
        public DateTime Expiry { get; set; }
        public bool IsUsed { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation property
        public User Admin { get; set; }
    }
}

