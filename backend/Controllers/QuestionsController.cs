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
            // Convert enum to short string code for database storage (fits in 10 char limit)
            var questionTypeString = dto.Type switch
            {
                QuestionType.MultipleChoice => "MCQ",
                QuestionType.TrueFalse => "TF",
                QuestionType.ShortAnswer => "SA",
                _ => dto.Type.ToString()
            };

            var question = new Question
            {
                QuizId = dto.QuizId,
                QuestionText = dto.QuestionText,
                QuestionType = questionTypeString
            };

            _context.Questions.Add(question);
            await _context.SaveChangesAsync();

            // Create answers if provided
            if (dto.Answers != null && dto.Answers.Count > 0)
            {
                var answers = dto.Answers.Select(a => new Answer
                {
                    QuestionId = question.Id,
                    AnswerText = a.Text,
                    IsCorrect = a.IsCorrect
                }).ToList();

                _context.Answers.AddRange(answers);
                await _context.SaveChangesAsync();
            }

            // Get quiz info for audit log
            var quiz = await _context.Quizzes.FindAsync(dto.QuizId);

            // Log audit trail
            var auditLog = new AuditLog
            {
                Action = "Create",
                EntityType = "Question",
                EntityId = question.Id,
                EntityName = quiz?.Title ?? $"Quiz {dto.QuizId}",
                Description = $"Question created: {question.QuestionText}",
                UserId = null,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            // Load answers for response
            await _context.Entry(question).Collection(q => q.Answers).LoadAsync();

            var response = new QuestionResponseDto
            {
                Id = question.Id,
                QuizId = question.QuizId,
                QuestionText = question.QuestionText,
                QuestionType = question.QuestionType,
                Answers = question.Answers?.Select(a => new AnswerResponseDto 
                { 
                    Id = a.Id, 
                    QuestionId = a.QuestionId, 
                    AnswerText = a.AnswerText, 
                    IsCorrect = a.IsCorrect 
                }).ToList() ?? new List<AnswerResponseDto>()
            };

            return CreatedAtAction(nameof(GetQuestion), new { id = question.Id }, response);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<QuestionResponseDto>> UpdateQuestion(int id, UpdateQuestionDto dto)
        {
            var q = await _context.Questions.Include(q => q.Answers).FirstOrDefaultAsync(q => q.Id == id);
            if (q == null) return NotFound();

            var previousText = q.QuestionText;
            q.QuestionText = dto.QuestionText ?? q.QuestionText;
            
            // Update question type if provided
            if (dto.Type.HasValue)
            {
                var questionTypeString = dto.Type.Value switch
                {
                    QuestionType.MultipleChoice => "MCQ",
                    QuestionType.TrueFalse => "TF",
                    QuestionType.ShortAnswer => "SA",
                    _ => dto.Type.Value.ToString()
                };
                q.QuestionType = questionTypeString;
            }

            // Update answers if provided
            if (dto.Answers != null && dto.Answers.Count > 0)
            {
                // Remove existing answers
                _context.Answers.RemoveRange(q.Answers);
                
                // Add new answers
                var newAnswers = dto.Answers.Select(a => new Answer
                {
                    QuestionId = q.Id,
                    AnswerText = a.Text,
                    IsCorrect = a.IsCorrect
                }).ToList();

                _context.Answers.AddRange(newAnswers);
            }

            await _context.SaveChangesAsync();

            // Get quiz info for audit log
            var quiz = await _context.Quizzes.FindAsync(q.QuizId);

            // Log audit trail
            var auditLog = new AuditLog
            {
                Action = "Update",
                EntityType = "Question",
                EntityId = q.Id,
                EntityName = quiz?.Title ?? $"Quiz {q.QuizId}",
                Description = $"Question updated",
                UserId = null,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            // Load answers for response
            await _context.Entry(q).Collection(question => question.Answers).LoadAsync();

            var response = new QuestionResponseDto
            {
                Id = q.Id,
                QuizId = q.QuizId,
                QuestionText = q.QuestionText,
                QuestionType = q.QuestionType,
                Answers = q.Answers?.Select(a => new AnswerResponseDto 
                { 
                    Id = a.Id, 
                    QuestionId = a.QuestionId, 
                    AnswerText = a.AnswerText, 
                    IsCorrect = a.IsCorrect 
                }).ToList() ?? new List<AnswerResponseDto>()
            };

            return Ok(response);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            var q = await _context.Questions.FindAsync(id);
            if (q == null) return NotFound();

            // Get quiz info for audit log
            var quiz = await _context.Quizzes.FindAsync(q.QuizId);

            _context.Questions.Remove(q);
            await _context.SaveChangesAsync();

            // Log audit trail
            var auditLog = new AuditLog
            {
                Action = "Delete",
                EntityType = "Question",
                EntityId = id,
                EntityName = quiz?.Title ?? $"Quiz {q.QuizId}",
                Description = $"Question deleted: {q.QuestionText}",
                UserId = null,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Question deleted successfully" });
        }
    }
}