using System;

namespace ids.Models
{
    public class LessonVideoProgress
    {
        public int Id { get; set; }
        public int LessonId { get; set; }
        public Lesson Lesson { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }

        public int LastWatchedSeconds { get; set; } = 0;
        public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

