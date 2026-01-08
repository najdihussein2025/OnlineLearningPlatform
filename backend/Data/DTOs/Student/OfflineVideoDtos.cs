using System;
using System.Collections.Generic;

namespace ids.Data.DTOs.Student
{
    /// <summary>
    /// Response DTO for download authorization request
    /// </summary>
    public class DownloadAuthorizationDto
    {
        public string DownloadUrl { get; set; }
        public DateTime ExpiresAt { get; set; }
        public int LessonId { get; set; }
    }

    /// <summary>
    /// DTO for syncing offline video progress
    /// </summary>
    public class OfflineVideoProgressDto
    {
        public int LastWatchedSeconds { get; set; }
        public DateTime WatchedAt { get; set; }
    }

    /// <summary>
    /// DTO for syncing multiple offline progress updates
    /// </summary>
    public class SyncOfflineProgressDto
    {
        public List<OfflineProgressItemDto> ProgressUpdates { get; set; } = new List<OfflineProgressItemDto>();
        public List<int> CompletedLessonIds { get; set; } = new List<int>();
    }

    /// <summary>
    /// Individual progress update item
    /// </summary>
    public class OfflineProgressItemDto
    {
        public int LessonId { get; set; }
        public int LastWatchedSeconds { get; set; }
        public DateTime WatchedAt { get; set; }
    }

    /// <summary>
    /// Response DTO for sync operation
    /// </summary>
    public class SyncOfflineProgressResponseDto
    {
        public int SyncedProgressCount { get; set; }
        public int SyncedCompletionCount { get; set; }
        public List<int> FailedLessonIds { get; set; } = new List<int>();
    }
}

