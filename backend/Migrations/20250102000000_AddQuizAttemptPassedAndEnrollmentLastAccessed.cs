using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ids.Migrations
{
    /// <inheritdoc />
    public partial class AddQuizAttemptPassedAndEnrollmentLastAccessed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Passed",
                table: "QuizAttempts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastAccessed",
                table: "Enrollments",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Passed",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "LastAccessed",
                table: "Enrollments");
        }
    }
}

