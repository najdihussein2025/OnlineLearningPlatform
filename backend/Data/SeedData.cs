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
                new { FullName = "Alex Turner", Email = "aturner@email.com", Password = "PassWord$111", Role = "student" },
                new { FullName = "Jane Instructor", Email = "instructor@test.com", Password = "password123", Role = "instructor" },
                new { FullName = "Site Admin", Email = "admin@test.com", Password = "password123", Role = "admin" }
            };

            foreach (var s in seeds)
            {
                var user = await context.Users.SingleOrDefaultAsync(u => u.Email == s.Email);
                if (user == null)
                {
                    user = new User
                    {
                        FullName = s.FullName,
                        Email = s.Email,
                        HashedPassword = PasswordHasher.Hash(s.Password),
                        Role = s.Role
                    };
                    context.Users.Add(user);
                    System.Console.WriteLine($"Seed: created user {s.Email}");
                }
                else
                {
                    // Update existing user's password/role/fullname to match seed (useful during dev)
                    user.HashedPassword = PasswordHasher.Hash(s.Password);
                    user.Role = s.Role;
                    user.FullName = s.FullName;
                    context.Users.Update(user);
                    System.Console.WriteLine($"Seed: updated user {s.Email}");
                }
            }

            await context.SaveChangesAsync();
        }
    }
}
