using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.Certificate;
using ids.Services;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CertificatesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly CertificatePdfService _pdfService;

        public CertificatesController(AppDbContext context, CertificatePdfService pdfService)
        {
            _context = context;
            _pdfService = pdfService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CertificateResponseDto>>> GetCertificates()
        {
            var certs = await _context.Certificates
                .Include(c => c.User)
                .Include(c => c.Course)
                .ToListAsync();
            var dtos = certs.Select(c => new CertificateResponseDto 
            { 
                Id = c.Id, 
                CourseId = c.CourseId, 
                UserId = c.UserId, 
                DownloadUrl = c.DownloadUrl, 
                GeneratedAt = c.GeneratedAt,
                StudentName = c.User?.FullName,
                CourseName = c.Course?.Title,
                VerificationCode = c.VerificationCode
            }).ToList();
            return Ok(dtos);
        }

        [HttpGet("completed-enrollments")]
        public async Task<ActionResult<IEnumerable<object>>> GetCompletedEnrollments()
        {
            var completedEnrollments = await _context.Enrollments
                .Where(e => e.Status == EnrollmentStatus.Completed)
                .Include(e => e.User)
                .Include(e => e.Course)
                .Select(e => new 
                { 
                    e.Id,
                    e.UserId,
                    StudentName = e.User.FullName,
                    e.CourseId,
                    CourseName = e.Course.Title,
                    e.CompletedAt
                })
                .ToListAsync();
            
            return Ok(completedEnrollments);
        }

        [HttpPost("generate")]
        public async Task<ActionResult> GenerateCertificate([FromBody] GenerateCertificateDto dto)
        {
            // Check if enrollment exists and is completed
            var enrollment = await _context.Enrollments
                .Where(e => e.UserId == dto.UserId && e.CourseId == dto.CourseId)
                .FirstOrDefaultAsync();

            if (enrollment == null || enrollment.Status != EnrollmentStatus.Completed)
            {
                return BadRequest("Student must have completed the course to receive a certificate.");
            }

            // Check if certificate already exists
            var existingCert = await _context.Certificates
                .FirstOrDefaultAsync(c => c.UserId == dto.UserId && c.CourseId == dto.CourseId);

            if (existingCert != null)
            {
                return Ok(new { message = "Certificate already exists for this student and course.", certificateId = existingCert.Id });
            }

            var student = await _context.Users.FindAsync(dto.UserId);
            var course = await _context.Courses.Include(c => c.Creator).FirstOrDefaultAsync(c => c.Id == dto.CourseId);
            var instructor = course?.Creator;

            if (student == null || course == null)
            {
                return NotFound("Student or course not found.");
            }

            // Generate verification code
            var verificationCode = $"CERT-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";

            // Create certificate
            var certificate = new Certificate
            {
                UserId = dto.UserId,
                CourseId = dto.CourseId,
                VerificationCode = verificationCode,
                GeneratedAt = DateTime.UtcNow,
                DownloadUrl = $"/api/certificates/{Guid.NewGuid()}/download"
            };

            _context.Certificates.Add(certificate);
            await _context.SaveChangesAsync();

            // Generate PDF
            var pdfBytes = _pdfService.GenerateCertificatePdf(certificate, student, course, instructor);
            
            return Ok(new 
            { 
                message = "Certificate generated successfully",
                certificateId = certificate.Id,
                verificationCode = certificate.VerificationCode,
                studentName = student.FullName,
                courseName = course.Title
            });
        }

        [HttpPost]
        public async Task<ActionResult<CertificateResponseDto>> CreateCertificate(CreateCertificateDto dto)
        {
            var c = new Certificate { CourseId = dto.CourseId, UserId = dto.UserId, DownloadUrl = dto.DownloadUrl };
            _context.Certificates.Add(c);
            await _context.SaveChangesAsync();
            var response = new CertificateResponseDto { Id = c.Id, CourseId = c.CourseId, UserId = c.UserId, DownloadUrl = c.DownloadUrl, GeneratedAt = c.GeneratedAt };
            return CreatedAtAction(nameof(GetCertificates), new { id = c.Id }, response);
        }
    }
}