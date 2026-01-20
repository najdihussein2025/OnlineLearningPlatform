using System;
using System.Collections.Generic;

namespace ids.Models
{
    public class Lesson
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public Course Course { get; set; }

        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? VideoUrl { get; set; }
        public string? PdfUrl { get; set; }
        public string? ExternalUrl { get; set; }
        public int Order { get; set; }
        public int EstimatedDuration { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Attachment> Attachments { get; set; }
        public ICollection<Quiz> Quizzes { get; set; }
        public ICollection<LessonCompletion> Completions { get; set; }
    }
}