using Microsoft.EntityFrameworkCore;
using ids.Models;

namespace ids.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        public DbSet<Quiz> Quizzes { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<Answer> Answers { get; set; }
        public DbSet<QuizAttempt> QuizAttempts { get; set; }
        public DbSet<LessonCompletion> LessonCompletions { get; set; }
        public DbSet<LessonVideoProgress> LessonVideoProgresses { get; set; }
        public DbSet<OfflineVideoDownload> OfflineVideoDownloads { get; set; }
        public DbSet<Certificate> Certificates { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        public DbSet<Attachment> Attachments { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FullName).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(200);
                entity.Property(e => e.HashedPassword).IsRequired();
                entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.Email).IsUnique();
            });

            modelBuilder.Entity<Course>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(300);
                entity.Property(e => e.ShortDescription).HasMaxLength(500);
                entity.Property(e => e.Category).HasMaxLength(100);
                entity.Property(e => e.Difficulty).HasMaxLength(50);
                entity.HasOne(e => e.Creator).WithMany().HasForeignKey(e => e.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Lesson>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(300);
                entity.HasOne(e => e.Course).WithMany(c => c.Lessons).HasForeignKey(e => e.CourseId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Quiz>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(300);
                entity.HasOne(e => e.Course).WithMany(c => c.Quizzes).HasForeignKey(e => e.CourseId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Lesson).WithMany(l => l.Quizzes).HasForeignKey(e => e.LessonId).OnDelete(DeleteBehavior.NoAction);
            });

            modelBuilder.Entity<Question>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.QuestionText).IsRequired();
                entity.Property(e => e.QuestionType).IsRequired().HasMaxLength(10);
                entity.HasOne(e => e.Quiz).WithMany(q => q.Questions).HasForeignKey(e => e.QuizId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Answer>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.AnswerText).IsRequired();
                entity.HasOne(e => e.Question).WithMany(q => q.Answers).HasForeignKey(e => e.QuestionId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<QuizAttempt>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Quiz).WithMany(q => q.Attempts).HasForeignKey(e => e.QuizId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<LessonCompletion>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Lesson).WithMany(l => l.Completions).HasForeignKey(e => e.LessonId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<LessonVideoProgress>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Lesson).WithMany().HasForeignKey(e => e.LessonId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
                // Ensure one progress record per user per lesson
                entity.HasIndex(e => new { e.UserId, e.LessonId }).IsUnique();
            });

            modelBuilder.Entity<OfflineVideoDownload>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Lesson).WithMany().HasForeignKey(e => e.LessonId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
                entity.Property(e => e.DeviceId).HasMaxLength(200);
                // Index for efficient queries
                entity.HasIndex(e => new { e.UserId, e.LessonId });
                entity.HasIndex(e => e.ExpiresAt);
            });

            modelBuilder.Entity<Certificate>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Course).WithMany(c => c.Certificates).HasForeignKey(e => e.CourseId).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Enrollment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Status).HasConversion<int>();
                entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Course).WithMany(c => c.Enrollments).HasForeignKey(e => e.CourseId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Attachment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FileUrl).IsRequired();
                entity.HasOne(e => e.Lesson).WithMany(l => l.Attachments).HasForeignKey(e => e.LessonId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Review>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Rating).IsRequired();
                entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Course).WithMany(c => c.Reviews).HasForeignKey(e => e.CourseId).OnDelete(DeleteBehavior.Cascade);
            });

        }
    }
}

