using Microsoft.EntityFrameworkCore.Migrations;
using System;

#nullable disable

namespace ids.Migrations
{
    /// <inheritdoc />
    public partial class AddOfflineVideoDownload : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                    DeviceId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
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
                name: "IX_OfflineVideoDownloads_LessonId",
                table: "OfflineVideoDownloads",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "IX_OfflineVideoDownloads_UserId",
                table: "OfflineVideoDownloads",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_OfflineVideoDownloads_UserId_LessonId",
                table: "OfflineVideoDownloads",
                columns: new[] { "UserId", "LessonId" });

            migrationBuilder.CreateIndex(
                name: "IX_OfflineVideoDownloads_ExpiresAt",
                table: "OfflineVideoDownloads",
                column: "ExpiresAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OfflineVideoDownloads");
        }
    }
}

