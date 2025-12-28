using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.Certificate;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CertificatesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CertificatesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CertificateResponseDto>>> GetCertificates()
        {
            var certs = await _context.Certificates.ToListAsync();
            var dtos = certs.Select(c => new CertificateResponseDto { Id = c.Id, CourseId = c.CourseId, UserId = c.UserId, DownloadUrl = c.DownloadUrl, GeneratedAt = c.GeneratedAt }).ToList();
            return Ok(dtos);
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