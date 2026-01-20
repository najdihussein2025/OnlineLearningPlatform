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
                var user = await context.Users.SingleOrDefaultAsync(u => u.Email == s.Email);
                if (user == null)
                {
                    user = new User
                    {
                        FullName = s.FullName,
                        Email = s.Email,
                        HashedPassword = PasswordHasher.Hash(s.Password),
                        Role = s.Role,
                        Status = "active"
                    };
                    context.Users.Add(user);
                    System.Console.WriteLine($"Seed: created user {s.Email}");
                }
                else
                {
                    // Update existing user's password/role/fullname/status to match seed (useful during dev)
                    user.HashedPassword = PasswordHasher.Hash(s.Password);
                    user.Role = s.Role;
                    user.FullName = s.FullName;
                    user.Status = "active";
                    context.Users.Update(user);
                    System.Console.WriteLine($"Seed: updated user {s.Email}");
                }
            }

            // Ensure all users have a status value
            var usersWithoutStatus = await context.Users.Where(u => string.IsNullOrEmpty(u.Status)).ToListAsync();
            foreach (var user in usersWithoutStatus)
            {
                user.Status = "active";
                context.Users.Update(user);
            }
            if (usersWithoutStatus.Count > 0)
            {
                System.Console.WriteLine($"Seed: updated {usersWithoutStatus.Count} users with missing status");
            }

            await context.SaveChangesAsync();
        }
    }
}
