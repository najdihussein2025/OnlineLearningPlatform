using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace ids.Services
{
    public interface IEmailService
    {
        Task Send2FACodeAsync(string email, string code);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task Send2FACodeAsync(string email, string code)
        {
            var smtpHost = _configuration["Smtp:Host"] ?? "sandbox.smtp.mailtrap.io";
            var smtpPort = int.Parse(_configuration["Smtp:Port"] ?? "587");
            var smtpUsername = _configuration["Smtp:Username"] ?? "bc26da1ee81249";
            var smtpPassword = _configuration["Smtp:Password"] ?? "ccae67d09aa2da";
            var smtpFromEmail = _configuration["Smtp:FromEmail"] ?? "noreply@onlinelearningplatform.com";
            var smtpFromName = _configuration["Smtp:FromName"] ?? "Online Learning Platform";

            using (var client = new SmtpClient(smtpHost, smtpPort))
            {
                client.Credentials = new NetworkCredential(smtpUsername, smtpPassword);
                client.EnableSsl = true;

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(smtpFromEmail, smtpFromName),
                    Subject = "Your Two-Factor Authentication Code",
                    Body = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif;'>
                            <h2>Two-Factor Authentication Code</h2>
                            <p>Your verification code is:</p>
                            <h1 style='color: #007bff; font-size: 32px; letter-spacing: 5px;'>{code}</h1>
                            <p>This code will expire in 5 minutes.</p>
                            <p>If you did not request this code, please ignore this email.</p>
                        </body>
                        </html>",
                    IsBodyHtml = true
                };

                mailMessage.To.Add(email);

                await client.SendMailAsync(mailMessage);
            }
        }
    }
}

