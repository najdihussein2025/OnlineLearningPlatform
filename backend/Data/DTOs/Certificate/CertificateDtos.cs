using System;

namespace ids.Data.DTOs.Certificate
{
    public class CreateCertificateDto
    {
        public int CourseId { get; set; }
        public int UserId { get; set; }
        public string DownloadUrl { get; set; }
    }

    public class GenerateCertificateDto
    {
        public int UserId { get; set; }
        public int CourseId { get; set; }
    }

    public class CertificateResponseDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public int UserId { get; set; }
        public string DownloadUrl { get; set; }
        public DateTime GeneratedAt { get; set; }
        public string StudentName { get; set; }
        public string CourseName { get; set; }
        public string VerificationCode { get; set; }
    }
}