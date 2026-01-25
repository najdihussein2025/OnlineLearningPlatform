using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Services;

namespace ids.Controllers
{
    /// <summary>
    /// RAG-based AI endpoint: database decides facts, Gemini formats the answer.
    /// Gemini must NEVER decide if a course exists; only database results determine that.
    /// </summary>
    [ApiController]
    [Route("api/ai")]
    [Authorize]
    public class AiController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly GeminiService _geminiService;

        public AiController(AppDbContext context, GeminiService geminiService)
        {
            _context = context;
            _geminiService = geminiService;
        }

        [HttpPost("ask")]
        public async Task<ActionResult> Ask([FromBody] AiAskRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.Question))
            {
                return BadRequest(new { message = "question is required" });
            }

            var question = request.Question.Trim();
            var questionLower = question.ToLowerInvariant();

            // Extract words from the question (length >= 2) to match against course titles
            var words = Regex.Split(questionLower, @"\W+")
                .Where(w => w.Length >= 2)
                .Distinct()
                .ToArray();

            // Database decides: search courses whose Title contains any word from the question
            var courses = await _context.Courses
                .Include(c => c.Creator)
                .Where(c => words.Any(w => c.Title != null && c.Title.ToLower().Contains(w)))
                .Select(c => new
                {
                    c.Title,
                    InstructorName = c.Creator != null ? c.Creator.FullName : "Unknown"
                })
                .ToListAsync();

            string prompt;
            if (courses.Count > 0)
            {
                var coursesData = string.Join("\n", courses.Select(c =>
                    $"Course: {c.Title} | Instructor: {c.InstructorName}"));
                prompt = $@"A student asked: '{question}'.

Here are the real courses from the platform database:

{coursesData}

Answer naturally telling the student that these courses exist and mention instructor names. Do not invent any other courses.";
            }
            else
            {
                prompt = $@"A student asked: '{question}'.

The database shows there are NO matching courses.

Tell the student politely that no such course exists currently. Do not invent or suggest courses.";
            }

            var answer = await _geminiService.GenerateFromPromptAsync(prompt);
            return Ok(new { response = answer });
        }
    }

    public class AiAskRequest
    {
        public string Question { get; set; } = string.Empty;
    }
}
