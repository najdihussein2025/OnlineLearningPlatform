using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;



using System.Security.Claims;
using ids.Data;


    using ids.Services;

var builder = WebApplication.CreateBuilder(args);

// Force the backend to listen on http://localhost:5000 so frontend can reach it


builder.WebHost.UseUrls("http://localhost:5000");

// Add services to the container.



builder.Services.AddControllers();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configure JSON serialization to use camelCase for frontend compatibility
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = false;
    });



// Add DbContext
builder.Services.AddDbContext<ids.Data.AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection") ?? 
        "Server=(localdb)\\MSSQLLocalDB;Database=OnlineLearningPlatform;Trusted_Connection=True;TrustServerCertificate=True"));
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// JWT configuration
var jwt = builder.Configuration.GetSection("Jwt");




var key = Encoding.UTF8.GetBytes(jwt["Key"] ?? "dev_secret_replace_with_env_or_user_secrets_change_me");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwt["Issuer"],
        ValidAudience = jwt["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key),



     
        ClockSkew = TimeSpan.Zero,
        // Explicitly map role claims to ensure authorization works correctly
        RoleClaimType = ClaimTypes.Role
    };
});

builder.Services.AddAuthorization();

// Register PDF service for certificate generation
builder.Services.AddScoped<CertificatePdfService>();


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact",
        policy =>
        {
            // Allow the ports used by your frontends during development



            policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });






});

var app = builder.Build();
// Run migrations and seed default accounts on startup
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        // Ensure database is created and seeded
        await SeedData.InitializeAsync(db);
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetService<ILoggerFactory>()?.CreateLogger("SeedData");
        logger?.LogError(ex, "An error occurred seeding the DB.");
    }



}
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
// Do not force HTTPS redirection during local dev to avoid issues when frontend uses HTTP





// app.UseHttpsRedirection();




app.UseCors("AllowReact");

app.UseAuthentication();


app.UseAuthorization();

app.MapControllers();

Console.WriteLine("Backend starting. Listening on http://localhost:5000");






app.Run();
