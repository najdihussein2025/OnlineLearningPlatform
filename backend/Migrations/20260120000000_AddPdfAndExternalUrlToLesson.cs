using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ids.Migrations
{
    /// <inheritdoc />
    public partial class AddPdfAndExternalUrlToLesson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PdfUrl",
                table: "Lessons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalUrl",
                table: "Lessons",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PdfUrl",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ExternalUrl",
                table: "Lessons");
        }
    }
}
