using System;
using System.Collections.Generic;

namespace ids.Data.DTOs.QuizAttempt
{
    public class CreateQuizAttemptDto
    {
        public int QuizId { get; set; }
        public int UserId { get; set; }
        public int Score { get; set; }
    }

    public class SubmitQuizAttemptDto
    {
        public List<QuestionAnswerDto> Answers { get; set; } = new List<QuestionAnswerDto>();
    }

    public class QuestionAnswerDto
    {
        public int QuestionId { get; set; }
        public List<int> SelectedAnswerIds { get; set; } = new List<int>();
    }

    public class QuizAttemptResponseDto
    {
        public int Id { get; set; }
        public int QuizId { get; set; }
        public int UserId { get; set; }
        public int Score { get; set; }
        public bool Passed { get; set; }
        public DateTime AttemptDate { get; set; }
    }

    public class QuizAttemptResultDto
    {
        public int AttemptId { get; set; }
        public int QuizId { get; set; }
        public int Score { get; set; }
        public int TotalQuestions { get; set; }
        public int PassingScore { get; set; }
        public bool Passed { get; set; }
        public DateTime AttemptDate { get; set; }
    }
}