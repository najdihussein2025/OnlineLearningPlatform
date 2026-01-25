using System;

namespace ids.Models
{
    public class Conversation
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public User Student { get; set; }
        public int InstructorId { get; set; }
        public User Instructor { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
