using System;

namespace ids.Models
{
    public class Attachment
    {
        public int Id { get; set; }
        public int LessonId { get; set; }
        public Lesson Lesson { get; set; }

        public string FileUrl { get; set; }
        public string FileType { get; set; } // PDF/Image
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}