using System;

namespace ids.Models
{
    public class Certificate
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public Course Course { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }

        public string DownloadUrl { get; set; }
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }
}