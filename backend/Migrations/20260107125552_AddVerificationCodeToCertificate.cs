using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ids.Migrations
{
    /// <inheritdoc />
    public partial class AddVerificationCodeToCertificate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Quizzes_Lessons_LessonId",
                table: "Quizzes");

            // Only add Passed column if it doesn't exist (using SQL)
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('QuizAttempts') AND name = 'Passed')
                BEGIN
                    ALTER TABLE [QuizAttempts] ADD [Passed] bit NOT NULL DEFAULT CAST(0 AS bit);
                END
            ");

            // Only add Enrollment columns if they don't exist
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Enrollments') AND name = 'CompletedAt')
                BEGIN
                    ALTER TABLE [Enrollments] ADD [CompletedAt] datetime2 NULL;
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Enrollments') AND name = 'LastAccessed')
                BEGIN
                    ALTER TABLE [Enrollments] ADD [LastAccessed] datetime2 NULL;
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Enrollments') AND name = 'StartedAt')
                BEGIN
                    ALTER TABLE [Enrollments] ADD [StartedAt] datetime2 NULL;
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Enrollments') AND name = 'Status')
                BEGIN
                    ALTER TABLE [Enrollments] ADD [Status] int NOT NULL DEFAULT 0;
                END
            ");

            // Add VerificationCode to Certificates (this is what we actually need)
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Certificates') AND name = 'VerificationCode')
                BEGIN
                    ALTER TABLE [Certificates] ADD [VerificationCode] nvarchar(max) NULL;
                END
            ");

            migrationBuilder.CreateTable(
                name: "LessonVideoProgresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LessonId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    LastWatchedSeconds = table.Column<int>(type: "int", nullable: false),
                    LastUpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LessonVideoProgresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LessonVideoProgresses_Lessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "Lessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LessonVideoProgresses_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OfflineVideoDownloads",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LessonId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    DownloadedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeviceId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OfflineVideoDownloads", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OfflineVideoDownloads_Lessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "Lessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OfflineVideoDownloads_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LessonVideoProgresses_LessonId",
                table: "LessonVideoProgresses",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "IX_LessonVideoProgresses_UserId_LessonId",
                table: "LessonVideoProgresses",
                columns: new[] { "UserId", "LessonId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OfflineVideoDownloads_ExpiresAt",
                table: "OfflineVideoDownloads",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_OfflineVideoDownloads_LessonId",
                table: "OfflineVideoDownloads",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "IX_OfflineVideoDownloads_UserId_LessonId",
                table: "OfflineVideoDownloads",
                columns: new[] { "UserId", "LessonId" });

            migrationBuilder.AddForeignKey(
                name: "FK_Quizzes_Lessons_LessonId",
                table: "Quizzes",
                column: "LessonId",
                principalTable: "Lessons",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Quizzes_Lessons_LessonId",
                table: "Quizzes");

            migrationBuilder.DropTable(
                name: "LessonVideoProgresses");

            migrationBuilder.DropTable(
                name: "OfflineVideoDownloads");

            migrationBuilder.DropColumn(
                name: "Passed",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "LastAccessed",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "StartedAt",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "VerificationCode",
                table: "Certificates");

            migrationBuilder.AddForeignKey(
                name: "FK_Quizzes_Lessons_LessonId",
                table: "Quizzes",
                column: "LessonId",
                principalTable: "Lessons",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
