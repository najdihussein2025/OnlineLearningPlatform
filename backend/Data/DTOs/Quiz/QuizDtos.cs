using System;

namespace ids.Data.DTOs.Quiz
{
    public class CreateQuizDto
    {
        public int CourseId { get; set; }
        public int? LessonId { get; set; }
        public string Title { get; set; }
        public int PassingScore { get; set; }
        public int TimeLimit { get; set; }
    }

    public class UpdateQuizDto
    {
        public string Title { get; set; }
        public int? PassingScore { get; set; }
        public int? TimeLimit { get; set; }
    }

    public class QuizResponseDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public int? LessonId { get; set; }
        public string Title { get; set; }
        public int PassingScore { get; set; }
        public int TimeLimit { get; set; }
    }
}