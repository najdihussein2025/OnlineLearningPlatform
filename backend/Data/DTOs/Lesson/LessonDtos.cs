using System;

namespace ids.Data.DTOs.Lesson
{
    public class CreateLessonDto
    {
        public int CourseId { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string VideoUrl { get; set; }
        public string PdfUrl { get; set; }
        public string ExternalUrl { get; set; }
        public int Order { get; set; }
        public int EstimatedDuration { get; set; }
    }

    public class UpdateLessonDto
    {
        public string Title { get; set; }
        public string Content { get; set; }
        public string VideoUrl { get; set; }
        public string PdfUrl { get; set; }
        public string ExternalUrl { get; set; }
        public int? Order { get; set; }
        public int? EstimatedDuration { get; set; }
    }

    public class LessonResponseDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string VideoUrl { get; set; }
        public string PdfUrl { get; set; }
        public string ExternalUrl { get; set; }
        public int Order { get; set; }
        public int EstimatedDuration { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}