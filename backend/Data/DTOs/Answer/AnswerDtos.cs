namespace ids.Data.DTOs.Answer
{
    public class CreateAnswerDto
    {
        public int QuestionId { get; set; }
        public string AnswerText { get; set; }
        public bool IsCorrect { get; set; }
    }

    public class UpdateAnswerDto
    {
        public string AnswerText { get; set; }
        public bool? IsCorrect { get; set; }
    }

    public class AnswerResponseDto
    {
        public int Id { get; set; }
        public int QuestionId { get; set; }
        public string AnswerText { get; set; }
        public bool IsCorrect { get; set; }
    }
}