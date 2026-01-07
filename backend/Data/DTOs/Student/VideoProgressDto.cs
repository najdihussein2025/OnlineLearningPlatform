namespace ids.Data.DTOs.Student
{
    public class SaveVideoProgressDto
    {
        public int LastWatchedSeconds { get; set; }
    }

    public class VideoProgressResponseDto
    {
        public int LastWatchedSeconds { get; set; }
        public System.DateTime LastUpdatedAt { get; set; }
    }
}

