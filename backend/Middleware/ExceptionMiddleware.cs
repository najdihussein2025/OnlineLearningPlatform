using System.Text.Json;
using ids.Services;
using Microsoft.AspNetCore.Hosting;

namespace ids.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context, IWebHostEnvironment env)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                ErrorLogger.Log(ex, env);

                // Set status code - 400 for validation errors, 500 for server errors
                var statusCode = ex.Message.Contains("validation", StringComparison.OrdinalIgnoreCase) ||
                                ex.Message.Contains("required", StringComparison.OrdinalIgnoreCase) ||
                                ex.Message.Contains("invalid", StringComparison.OrdinalIgnoreCase)
                    ? 400
                    : 500;

                context.Response.StatusCode = statusCode;
                context.Response.ContentType = "application/json";

                await context.Response.WriteAsync(
                    JsonSerializer.Serialize(new
                    {
                        error = ex.Message,
                        stackTrace = ex.StackTrace
                    }));
            }
        }
    }
}

