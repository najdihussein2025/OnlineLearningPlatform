using System;

namespace ids.Models
{
    /// <summary>
    /// Tracks offline video downloads for students
    /// Used for security, analytics, and access control
    /// </summary>
    public class OfflineVideoDownload
    {
        public int Id { get; set; }
        public int LessonId { get; set; }
        public Lesson Lesson { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }

        /// <summary>
        /// When the download was authorized/initiated
        /// </summary>
        public DateTime DownloadedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Expiration time for offline access (e.g., 30 days from download)
        /// </summary>
        public DateTime ExpiresAt { get; set; }

        /// <summary>
        /// Device identifier or fingerprint (optional, for device-specific tracking)
        /// </summary>
        public string DeviceId { get; set; }

        /// <summary>
        /// Whether the download is still valid (not revoked)
        /// </summary>
        public bool IsActive { get; set; } = true;
    }
}

