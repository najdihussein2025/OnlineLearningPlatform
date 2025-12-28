using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Models;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttachmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AttachmentsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Attachment>>> GetAttachments()
        {
            return Ok(await _context.Attachments.Include(a => a.Lesson).ToListAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Attachment>> GetAttachment(int id)
        {
            var a = await _context.Attachments.FindAsync(id);
            if (a == null) return NotFound();
            return Ok(a);
        }

        [HttpPost]
        public async Task<ActionResult<Attachment>> CreateAttachment(Attachment dto)
        {
            _context.Attachments.Add(dto);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAttachment), new { id = dto.Id }, dto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAttachment(int id)
        {
            var a = await _context.Attachments.FindAsync(id);
            if (a == null) return NotFound();

            _context.Attachments.Remove(a);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Attachment deleted successfully" });
        }
    }
}