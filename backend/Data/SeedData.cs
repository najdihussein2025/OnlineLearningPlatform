using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ids.Models;
using ids.Services;

namespace ids.Data
{
    public static class SeedData
    {
        public static async Task InitializeAsync(AppDbContext context)
        {
            // Ensure database created
            await context.Database.MigrateAsync();

            // Prepare seed accounts
            var seeds = new[]
            {
                new { FullName = "Alex Turner", Email = "aturner@email.com", Password = "PassWord$111", Role = "Student" },
                new { FullName = "Jane Instructor", Email = "instructor@test.com", Password = "password123", Role = "Instructor" },
                new { FullName = "Site Admin", Email = "admin@test.com", Password = "password123", Role = "Admin" }
            };

            foreach (var s in seeds)
            {
                var user = await context.Users
                    .SingleOrDefaultAsync(u => u.Email == s.Email);

                if (user == null)
                {
                    user = new User
                    {
                        FullName = s.FullName,
                        Email = s.Email,
                        HashedPassword = PasswordHasher.Hash(s.Password),
                        Role = s.Role,
                        Status = "active",
                        CreatedAt = DateTime.UtcNow
                    };

                    context.Users.Add(user);
                }
            }

            await context.SaveChangesAsync();
        }
    }
}
