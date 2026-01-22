using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using ids.Data;
using ids.Middleware;
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
    
    // Configure JWT for SignalR
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chatHub"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// Add distributed cache (required for session)
builder.Services.AddDistributedMemoryCache();

// Add session support for 2FA flow
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(15);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
});

// Register HTTP Client Factory for external API calls
builder.Services.AddHttpClient();

// Register PDF service for certificate generation
builder.Services.AddScoped<CertificatePdfService>();

// Register Gemini service for chatbot
builder.Services.AddScoped<GeminiService>();

// Register Email service for 2FA
builder.Services.AddScoped<IEmailService, EmailService>();

// Add SignalR
builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact",
        policy =>
        {
            // Allow the ports used by your frontends during development



            policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });






});

var app = builder.Build();

// Log startup errors
try
{
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        var context = services.GetRequiredService<AppDbContext>();
        await SeedData.InitializeAsync(context);
    }
}
catch (Exception ex)
{
    var logDir = Path.Combine(app.Environment.ContentRootPath, "Logs");
    var logPath = Path.Combine(logDir, "errors.txt");
    
    if (!Directory.Exists(logDir))
        Directory.CreateDirectory(logDir);
    
    var error = $@"
==============================
Date: {DateTime.Now}
Type: Startup Error
Message: {ex.Message}
Inner: {ex.InnerException?.Message}
StackTrace:
{ex.StackTrace}
==============================

";
    File.AppendAllText(logPath, error);
    Console.WriteLine($"Startup error: {ex.Message}");
    throw; // Re-throw to prevent app from starting with errors
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

// Use session before authentication (session is needed for 2FA flow)
app.UseSession();

app.UseAuthentication();

app.UseMiddleware<ExceptionMiddleware>();

app.UseAuthorization();

app.MapControllers();

// Map SignalR Hub
app.MapHub<ids.Hubs.ChatHub>("/chatHub");

Console.WriteLine("Backend starting. Listening on http://localhost:5000");






app.Run();
