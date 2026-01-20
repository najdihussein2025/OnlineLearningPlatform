using System;

namespace ids.Models
{
    public class AuditLog
    {
        public int Id { get; set; }
        public string Action { get; set; } // Create, Update, Delete
        public string EntityType { get; set; } // Quiz, Course, User, Lesson, etc.
        public int EntityId { get; set; }
        public string EntityName { get; set; } // The name/title of the entity
        public string Description { get; set; } // Detailed description of what happened
        public int? UserId { get; set; } // Who performed the action
        public User User { get; set; } // Navigation property
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
