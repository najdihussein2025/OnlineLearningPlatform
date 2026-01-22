using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Models;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext _context;
        
        // Static variable to store chatbot visibility (in-memory storage)
        // TODO: Replace with database storage using a Settings table
        private static bool _chatbotEnabled = false;

        public SettingsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("chatbot-visibility")]
        [Authorize] // Allow all authenticated users to read chatbot visibility
        public async Task<ActionResult> GetChatbotVisibility()
        {
            try
            {
                // Return the stored chatbot visibility setting
                return Ok(new { isEnabled = _chatbotEnabled });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while fetching chatbot visibility", error = ex.Message });
            }
        }

        [HttpPut("chatbot-visibility")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> UpdateChatbotVisibility([FromBody] ChatbotVisibilityDto dto)
        {
            try
            {
                // Update the stored chatbot visibility setting
                _chatbotEnabled = dto.IsEnabled;
                
                // TODO: Implement actual database storage for settings
                // For now, using static variable for in-memory storage
                
                return Ok(new { message = "Chatbot visibility updated successfully", isEnabled = dto.IsEnabled });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating chatbot visibility", error = ex.Message });
            }
        }
    }

    public class ChatbotVisibilityDto
    {
        public bool IsEnabled { get; set; }
    }
}

