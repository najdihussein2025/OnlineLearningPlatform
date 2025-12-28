using System;

namespace ids.Data.DTOs.LessonCompletion
{
    public class CreateLessonCompletionDto
    {
        public int LessonId { get; set; }
        public int UserId { get; set; }
    }

    public class LessonCompletionResponseDto
    {
        public int Id { get; set; }
        public int LessonId { get; set; }
        public int UserId { get; set; }
        public DateTime CompletedDate { get; set; }
    }
}