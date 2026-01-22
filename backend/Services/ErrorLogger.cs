using Microsoft.AspNetCore.Hosting;
using System.Text.Json;

namespace ids.Services
{
    public static class ErrorLogger
    {
        public static void Log(Exception ex, IWebHostEnvironment env)
        {
            try
            {
                var logDir = Path.Combine(env.ContentRootPath, "Logs");
                var logPath = Path.Combine(logDir, "errors.txt");

                if (!Directory.Exists(logDir))
                    Directory.CreateDirectory(logDir);

                var error = $@"
==============================
Date: {DateTime.Now}
Message: {ex.Message}
Inner: {ex.InnerException?.Message}
StackTrace:
{ex.StackTrace}
==============================

";
                File.AppendAllText(logPath, error);
            }
            catch
            {
                // If logging fails, at least try to write to console
                Console.WriteLine($"CRITICAL: Failed to log exception to file. Exception: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
            }
        }

        public static void LogFrontendError(string source, string message, object? errorData, IWebHostEnvironment env)
        {
            try
            {
                var logDir = Path.Combine(env.ContentRootPath, "Logs");
                var logPath = Path.Combine(logDir, "frontend-errors.txt");

                if (!Directory.Exists(logDir))
                    Directory.CreateDirectory(logDir);

                var errorDataJson = errorData != null 
                    ? JsonSerializer.Serialize(errorData, new JsonSerializerOptions { WriteIndented = true })
                    : "No additional data";

                var error = $@"
==============================
Date: {DateTime.Now}
Source: {source}
Message: {message}
Error Data:
{errorDataJson}
==============================

";
                File.AppendAllText(logPath, error);
            }
            catch
            {
                // If logging fails, at least try to write to console
                Console.WriteLine($"CRITICAL: Failed to log frontend error to file. Source: {source}, Message: {message}");
            }
        }
    }
}

