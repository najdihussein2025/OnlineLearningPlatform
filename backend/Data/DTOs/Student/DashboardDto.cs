namespace ids.Data.DTOs.Student
{
    public class DashboardDto
    {
        public DashboardSummaryDto Summary { get; set; } = new();
        public List<CourseProgressDto> Courses { get; set; } = new();
    }

    public class DashboardSummaryDto
    {
        public int TotalEnrolledCourses { get; set; }
        public int CompletedCourses { get; set; }
        public int InProgressCourses { get; set; }
        public double OverallCompletionPercentage { get; set; }
    }

    public class CourseProgressDto
    {
        public int CourseId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // NotStarted, InProgress, Completed
        public int CompletionPercentage { get; set; }
        public int CompletedLessons { get; set; }
        public int TotalLessons { get; set; }
        public int CompletedQuizzes { get; set; } // All attempted quizzes (passed or failed)
        public int PassedQuizzes { get; set; } // Only passed quizzes
        public int TotalQuizzes { get; set; }
        public DateTime? LastAccessed { get; set; }
        public int? NextLessonId { get; set; }
    }
}

