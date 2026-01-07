using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ids.Migrations
{
    /// <inheritdoc />
    public partial class AddLessonVideoProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LessonVideoProgresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LessonId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    LastWatchedSeconds = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
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

            migrationBuilder.CreateIndex(
                name: "IX_LessonVideoProgresses_LessonId",
                table: "LessonVideoProgresses",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "IX_LessonVideoProgresses_UserId",
                table: "LessonVideoProgresses",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_LessonVideoProgresses_UserId_LessonId",
                table: "LessonVideoProgresses",
                columns: new[] { "UserId", "LessonId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LessonVideoProgresses");
        }
    }
}

