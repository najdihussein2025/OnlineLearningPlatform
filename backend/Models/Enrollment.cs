using System;

namespace ids.Models
{
    public enum EnrollmentStatus
    {
        NotStarted = 0,
        InProgress = 1,
        Completed = 2
    }

    public class Enrollment
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }

        public int CourseId { get; set; }
        public Course Course { get; set; } = null!;

        public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
        public EnrollmentStatus Status { get; set; } = EnrollmentStatus.NotStarted;
        public DateTime? StartedAt { get; set; }
        public DateTime? LastAccessed { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}