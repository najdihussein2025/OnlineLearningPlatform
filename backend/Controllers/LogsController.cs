using Microsoft.AspNetCore.Mvc;
using ids.Services;
using Microsoft.AspNetCore.Hosting;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LogsController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public LogsController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpPost("frontend-error")]
        public IActionResult LogFrontendError([FromBody] FrontendErrorRequest request)
        {
            try
            {
                ErrorLogger.LogFrontendError(
                    request.Source ?? "Unknown",
                    request.Message ?? "No message provided",
                    request.ErrorData,
                    _env
                );
                return Ok(new { message = "Error logged successfully" });
            }
            catch
            {
                // Silently fail - we don't want logging errors to break the app
                return Ok(new { message = "Error logged" });
            }
        }
    }

    public class FrontendErrorRequest
    {
        public string? Source { get; set; }
        public string? Message { get; set; }
        public object? ErrorData { get; set; }
    }
}

