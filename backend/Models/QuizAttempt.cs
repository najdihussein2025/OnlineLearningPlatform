using System;

namespace ids.Models
{
    public class QuizAttempt
    {
        public int Id { get; set; }
        public int QuizId { get; set; }
        public Quiz Quiz { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }

        public int Score { get; set; }
        public bool Passed { get; set; }
        public DateTime AttemptDate { get; set; } = DateTime.UtcNow;
    }
}