using System;

namespace ids.Data.DTOs.Enrollment
{
    public class CreateEnrollmentDto
    {
        public int UserId { get; set; }
        public int CourseId { get; set; }
    }

    public class EnrollmentResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int CourseId { get; set; }
        public DateTime EnrolledAt { get; set; }
    }
}