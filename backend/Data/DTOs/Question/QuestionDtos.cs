using System.Collections.Generic;

namespace ids.Data.DTOs.Question
{
    public class CreateQuestionDto
    {
        public int QuizId { get; set; }
        public string QuestionText { get; set; }
        public string QuestionType { get; set; }
    }

    public class UpdateQuestionDto
    {
        public string QuestionText { get; set; }
        public string QuestionType { get; set; }
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