using System;

namespace ids.Models
{
    public class LessonCompletion
    {
        public int Id { get; set; }
        public int LessonId { get; set; }
        public Lesson Lesson { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }

        public DateTime CompletedDate { get; set; } = DateTime.UtcNow;
    }
}