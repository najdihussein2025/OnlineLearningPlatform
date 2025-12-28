using System;

namespace ids.Data.DTOs.QuizAttempt
{
    public class CreateQuizAttemptDto
    {
        public int QuizId { get; set; }
        public int UserId { get; set; }
        public int Score { get; set; }
    }

    public class QuizAttemptResponseDto
    {
        public int Id { get; set; }
        public int QuizId { get; set; }
        public int UserId { get; set; }
        public int Score { get; set; }
        public DateTime AttemptDate { get; set; }
    }
}