using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ids.Data;
using ids.Models;
using ids.Data.DTOs.Question;
using ids.Data.DTOs.Answer;

namespace ids.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuestionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public QuestionsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<QuestionResponseDto>>> GetQuestions()
        {
            var questions = await _context.Questions.Include(q => q.Answers).ToListAsync();
            var dtos = questions.Select(q => new QuestionResponseDto
            {
                Id = q.Id,
                QuizId = q.QuizId,
                QuestionText = q.QuestionText,
                QuestionType = q.QuestionType,
                Answers = q.Answers?.Select(a => new AnswerResponseDto { Id = a.Id, QuestionId = a.QuestionId, AnswerText = a.AnswerText, IsCorrect = a.IsCorrect }).ToList()
            }).ToList();
            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<QuestionResponseDto>> GetQuestion(int id)
        {
            var q = await _context.Questions.Include(q => q.Answers).FirstOrDefaultAsync(q => q.Id == id);
            if (q == null) return NotFound();
            var dto = new QuestionResponseDto
            {
                Id = q.Id,
                QuizId = q.QuizId,
                QuestionText = q.QuestionText,
                QuestionType = q.QuestionType,
                Answers = q.Answers?.Select(a => new AnswerResponseDto { Id = a.Id, QuestionId = a.QuestionId, AnswerText = a.AnswerText, IsCorrect = a.IsCorrect }).ToList()
            };
            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<QuestionResponseDto>> CreateQuestion(CreateQuestionDto dto)
        {
            var question = new Question
            {
                QuizId = dto.QuizId,
                QuestionText = dto.QuestionText,
                QuestionType = dto.QuestionType
            };

            _context.Questions.Add(question);
            await _context.SaveChangesAsync();

            var response = new QuestionResponseDto
            {
                Id = question.Id,
                QuizId = question.QuizId,
                QuestionText = question.QuestionText,
                QuestionType = question.QuestionType,
                Answers = new List<AnswerResponseDto>()
            };

            return CreatedAtAction(nameof(GetQuestion), new { id = question.Id }, response);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateQuestion(int id, UpdateQuestionDto dto)
        {
            var q = await _context.Questions.FindAsync(id);
            if (q == null) return NotFound();

            q.QuestionText = dto.QuestionText ?? q.QuestionText;
            q.QuestionType = dto.QuestionType ?? q.QuestionType;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            var q = await _context.Questions.FindAsync(id);
            if (q == null) return NotFound();

            _context.Questions.Remove(q);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Question deleted successfully" });
        }
    }
}