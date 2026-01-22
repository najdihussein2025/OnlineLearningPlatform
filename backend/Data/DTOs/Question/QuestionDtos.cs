using System.Collections.Generic;
using ids.Models;

namespace ids.Data.DTOs.Question
{
    public class CreateQuestionAnswerDto
    {
        public string Text { get; set; }
        public bool IsCorrect { get; set; }
    }

    public class CreateQuestionDto
    {
        public int QuizId { get; set; }
        public string QuestionText { get; set; }
        public QuestionType Type { get; set; }
        public List<CreateQuestionAnswerDto> Answers { get; set; }
    }

    public class UpdateQuestionDto
    {
        public string QuestionText { get; set; }
        public QuestionType? Type { get; set; }
        public List<CreateQuestionAnswerDto> Answers { get; set; }
    }

    public class QuestionResponseDto
    {
        public int Id { get; set; }
        public int QuizId { get; set; }
        public string QuestionText { get; set; }
        public string QuestionType { get; set; }
        public List<ids.Data.DTOs.Answer.AnswerResponseDto> Answers { get; set; }
    }
}