namespace ids.Data.DTOs.Student
{
    public class ContinueLearningResponseDto
    {
        public bool CourseCompleted { get; set; }
        public int? LessonId { get; set; }
        public string? LessonTitle { get; set; }
        public int? LessonOrder { get; set; }
    }
}

