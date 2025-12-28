using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.Quiz;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuizzesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public QuizzesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<QuizResponseDto>>> GetQuizzes()
        {
            var quizzes = await _context.Quizzes.ToListAsync();
            var dtos = quizzes.Select(q => new QuizResponseDto
            {
                Id = q.Id,
                CourseId = q.CourseId,
                LessonId = q.LessonId,
                Title = q.Title,
                PassingScore = q.PassingScore,
                TimeLimit = q.TimeLimit
            }).ToList();

            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<QuizResponseDto>> GetQuiz(int id)
        {
            var q = await _context.Quizzes.FindAsync(id);
            if (q == null) return NotFound();
            var dto = new QuizResponseDto
            {
                Id = q.Id,
                CourseId = q.CourseId,
                LessonId = q.LessonId,
                Title = q.Title,
                PassingScore = q.PassingScore,
                TimeLimit = q.TimeLimit
            };
            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<QuizResponseDto>> CreateQuiz(CreateQuizDto dto)
        {
            var quiz = new Quiz
            {
                CourseId = dto.CourseId,
                LessonId = dto.LessonId,
                Title = dto.Title,
                PassingScore = dto.PassingScore,
                TimeLimit = dto.TimeLimit
            };

            _context.Quizzes.Add(quiz);
            await _context.SaveChangesAsync();

            var response = new QuizResponseDto
            {
                Id = quiz.Id,
                CourseId = quiz.CourseId,
                LessonId = quiz.LessonId,
                Title = quiz.Title,
                PassingScore = quiz.PassingScore,
                TimeLimit = quiz.TimeLimit
            };

            return CreatedAtAction(nameof(GetQuiz), new { id = quiz.Id }, response);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateQuiz(int id, UpdateQuizDto dto)
        {
            var quiz = await _context.Quizzes.FindAsync(id);
            if (quiz == null) return NotFound();

            quiz.Title = dto.Title ?? quiz.Title;
            if (dto.PassingScore.HasValue) quiz.PassingScore = dto.PassingScore.Value;
            if (dto.TimeLimit.HasValue) quiz.TimeLimit = dto.TimeLimit.Value;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuiz(int id)
        {
            var quiz = await _context.Quizzes.FindAsync(id);
            if (quiz == null) return NotFound();

            _context.Quizzes.Remove(quiz);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Quiz deleted successfully" });
        }
    }
}