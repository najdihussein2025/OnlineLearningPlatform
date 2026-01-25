using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ids.Migrations
{
    /// <inheritdoc />
    [Migration("20260126000000_RefactorChatToConversations")]
    public class RefactorChatToConversations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Create Conversations table (one per student-instructor pair)
            migrationBuilder.CreateTable(
                name: "Conversations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    InstructorId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Conversations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Conversations_Users_InstructorId",
                        column: x => x.InstructorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Conversations_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_InstructorId",
                table: "Conversations",
                column: "InstructorId");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_StudentId_InstructorId",
                table: "Conversations",
                columns: new[] { "StudentId", "InstructorId" },
                unique: true);

            // 2. Create Messages table
            migrationBuilder.CreateTable(
                name: "Messages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConversationId = table.Column<int>(type: "int", nullable: false),
                    SenderId = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Messages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Messages_Conversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "Conversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Messages_Users_SenderId",
                        column: x => x.SenderId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ConversationId",
                table: "Messages",
                column: "ConversationId");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_SenderId",
                table: "Messages",
                column: "SenderId");

            // 3. Migrate existing ChatMessages into Conversations + Messages
            // Conversations: distinct (StudentId, InstructorId) from ChatMessages (instructor = course.CreatedBy)
            migrationBuilder.Sql(@"
                INSERT INTO Conversations (StudentId, InstructorId, CreatedAt)
                SELECT DISTINCT 
                    CASE WHEN cm.SenderId = c.CreatedBy THEN cm.ReceiverId ELSE cm.SenderId END,
                    c.CreatedBy,
                    ISNULL(MIN(cm.SentAt), GETUTCDATE())
                FROM ChatMessages cm
                INNER JOIN Courses c ON c.Id = cm.CourseId
                GROUP BY 
                    CASE WHEN cm.SenderId = c.CreatedBy THEN cm.ReceiverId ELSE cm.SenderId END, 
                    c.CreatedBy
            ");

            // Messages: from ChatMessages into Messages using ConversationId
            migrationBuilder.Sql(@"
                INSERT INTO Messages (ConversationId, SenderId, Content, SentAt)
                SELECT conv.Id, cm.SenderId, cm.Message, cm.SentAt
                FROM ChatMessages cm
                INNER JOIN Courses c ON c.Id = cm.CourseId
                INNER JOIN Conversations conv 
                    ON conv.StudentId = (CASE WHEN cm.SenderId = c.CreatedBy THEN cm.ReceiverId ELSE cm.SenderId END) 
                    AND conv.InstructorId = c.CreatedBy
            ");

            // 4. Drop old ChatMessages table
            migrationBuilder.DropTable(
                name: "ChatMessages");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Messages");

            migrationBuilder.DropTable(
                name: "Conversations");

            // Recreate ChatMessages (empty) so downgrade is valid
            migrationBuilder.CreateTable(
                name: "ChatMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CourseId = table.Column<int>(type: "int", nullable: false),
                    SenderId = table.Column<int>(type: "int", nullable: false),
                    ReceiverId = table.Column<int>(type: "int", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatMessages_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatMessages_Users_ReceiverId",
                        column: x => x.ReceiverId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChatMessages_Users_SenderId",
                        column: x => x.SenderId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_CourseId",
                table: "ChatMessages",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ReceiverId",
                table: "ChatMessages",
                column: "ReceiverId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_SenderId_ReceiverId",
                table: "ChatMessages",
                columns: new[] { "SenderId", "ReceiverId" });
        }
    }
}
