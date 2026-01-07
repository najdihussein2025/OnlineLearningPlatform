using System;
using System.IO;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ids.Models;

namespace ids.Services
{
    public class CertificatePdfService
    {
        public byte[] GenerateCertificatePdf(Certificate certificate, User student, Course course, User instructor)
        {
            QuestPDF.Settings.License = LicenseType.Community;
            
            var verificationCode = certificate.VerificationCode ?? $"CERT-{certificate.Id:D6}-{certificate.CourseId:D4}";
            var studentName = student?.FullName ?? "Student";
            var courseTitle = course?.Title ?? "Course";
            var instructorName = instructor?.FullName ?? "Instructor";
            var completionDate = certificate.GeneratedAt.ToString("MMMM dd, yyyy");
            var issueDate = certificate.GeneratedAt.ToString("MMMM dd, yyyy");

            var pdfBytes = Document.Create(container =>
            {
                container.Page(page =>
                {
                    // Force A4 landscape with reduced margins
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(30);
                    page.PageColor(Colors.White);
                    
                    // Single page content - no page breaks
                    page.Content()
                        .Padding(20)
                        .Border(2)
                        .BorderColor(Colors.Blue.Darken2)
                        .Padding(25)
                        .Column(column =>
                        {
                            // Logo/Platform Name
                            column.Item()
                                .AlignCenter()
                                .Text("Online Learning Platform")
                                .FontSize(22)
                                .FontFamily("Times New Roman")
                                .Bold()
                                .FontColor(Colors.Blue.Darken2);

                            column.Item().Height(20);

                            // Certificate Title
                            column.Item()
                                .AlignCenter()
                                .Text("CERTIFICATE OF COMPLETION")
                                .FontSize(28)
                                .FontFamily("Times New Roman")
                                .Bold()
                                .FontColor(Colors.Black);

                            column.Item().Height(25);

                            // This is to certify that
                            column.Item()
                                .AlignCenter()
                                .Text("This is to certify that")
                                .FontSize(14)
                                .FontFamily("Times New Roman")
                                .FontColor(Colors.Grey.Darken1);

                            column.Item().Height(20);

                            // Student Name (BIG, CENTERED)
                            column.Item()
                                .AlignCenter()
                                .Text(studentName)
                                .FontSize(32)
                                .FontFamily("Times New Roman")
                                .Bold()
                                .FontColor(Colors.Blue.Darken3);

                            column.Item().Height(20);

                            // Has successfully completed
                            column.Item()
                                .AlignCenter()
                                .Text("has successfully completed")
                                .FontSize(14)
                                .FontFamily("Times New Roman")
                                .FontColor(Colors.Grey.Darken1);

                            column.Item().Height(15);

                            // Course Name
                            column.Item()
                                .AlignCenter()
                                .Text(courseTitle)
                                .FontSize(22)
                                .FontFamily("Times New Roman")
                                .Bold()
                                .FontColor(Colors.Blue.Darken2);

                            column.Item().Height(30);

                            // Details row
                            column.Item()
                                .Row(row =>
                                {
                                    // Left: Completion Date
                                    row.RelativeItem()
                                        .Column(col =>
                                        {
                                            col.Item()
                                                .Text("Completion Date:")
                                                .FontSize(11)
                                                .FontFamily("Times New Roman")
                                                .FontColor(Colors.Grey.Darken1);
                                            col.Item()
                                                .PaddingTop(4)
                                                .Text(completionDate)
                                                .FontSize(13)
                                                .FontFamily("Times New Roman")
                                                .Bold();
                                        });

                                    // Center: Verification Code
                                    row.RelativeItem()
                                        .AlignCenter()
                                        .Column(col =>
                                        {
                                            col.Item()
                                                .Text("Verification Code:")
                                                .FontSize(11)
                                                .FontFamily("Times New Roman")
                                                .FontColor(Colors.Grey.Darken1);
                                            col.Item()
                                                .PaddingTop(4)
                                                .Text(verificationCode)
                                                .FontSize(13)
                                                .FontFamily("Courier New")
                                                .Bold()
                                                .FontColor(Colors.Blue.Darken2);
                                        });

                                    // Right: Instructor
                                    row.RelativeItem()
                                        .AlignRight()
                                        .Column(col =>
                                        {
                                            col.Item()
                                                .Text("Instructor:")
                                                .FontSize(11)
                                                .FontFamily("Times New Roman")
                                                .FontColor(Colors.Grey.Darken1);
                                            col.Item()
                                                .PaddingTop(4)
                                                .Text(instructorName)
                                                .FontSize(13)
                                                .FontFamily("Times New Roman")
                                                .Bold();
                                        });
                                });

                            column.Item().Height(35);

                            // Signature line
                            column.Item()
                                .AlignCenter()
                                .PaddingTop(15)
                                .BorderTop(1)
                                .BorderColor(Colors.Grey.Darken1)
                                .PaddingTop(8)
                                .Text("Certificate Issued By")
                                .FontSize(11)
                                .FontFamily("Times New Roman")
                                .FontColor(Colors.Grey.Darken1);
                        });
                });
            })
            .GeneratePdf();

            return pdfBytes;
        }
    }
}

