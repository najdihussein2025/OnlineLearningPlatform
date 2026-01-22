using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using ids.Services;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatbotController : ControllerBase
    {
        private readonly GeminiService _geminiService;

        public ChatbotController(GeminiService geminiService)
        {
            _geminiService = geminiService;
        }

        [HttpPost("ask")]
        public async Task<ActionResult> AskQuestion([FromBody] ChatbotRequestDto request)
        {
            try
            {
                Console.WriteLine($"[ChatbotController] 📥 POST /api/chatbot/ask - Request received");
                Console.WriteLine($"[ChatbotController] 📝 User message: {request.Message}");
                
                if (string.IsNullOrWhiteSpace(request.Message))
                {
                    Console.WriteLine($"[ChatbotController] ❌ ERROR: Message is empty");
                    return BadRequest(new { message = "Message cannot be empty" });
                }

                Console.WriteLine($"[ChatbotController] 🔄 Calling GeminiService.GetResponseAsync...");
                var startTime = DateTime.UtcNow;
                
                var response = await _geminiService.GetResponseAsync(request.Message);
                
                var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
                Console.WriteLine($"[ChatbotController] ⏱️ Total processing time: {duration:F0}ms");
                Console.WriteLine($"[ChatbotController] ✅ Response generated successfully");
                Console.WriteLine($"[ChatbotController] 💬 Response preview: {response.Substring(0, Math.Min(100, response.Length))}...");

                return Ok(new { response = response });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ChatbotController] ❌ EXCEPTION: {ex.Message}");
                Console.WriteLine($"[ChatbotController] 📚 Stack trace: {ex.StackTrace}");
                ErrorLogger.Log(ex, HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>());
                return StatusCode(500, new { message = "An error occurred while processing your request", error = ex.Message });
            }
        }
    }

    public class ChatbotRequestDto
    {
        public string Message { get; set; } = string.Empty;
    }
}

