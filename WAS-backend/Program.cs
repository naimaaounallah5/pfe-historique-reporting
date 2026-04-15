using Microsoft.EntityFrameworkCore;
using WAS_backend.Data;
using WAS_backend.Repositories;
using WAS_backend.Services;
using WAS_backend.Hubs;

var builder = WebApplication.CreateBuilder(args);

// ── Controllers ─────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ── SignalR ──────────────────────────────────────────────────
builder.Services.AddSignalR();

// ── DbContext → SQL Server ───────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// ── CORS ─────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                 "http://localhost:5174",
                "http://localhost:3000"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();  // ← OBLIGATOIRE pour SignalR
    });
});
// ── DbWatcher — surveille la DB et met à jour le dashboard ──
builder.Services.AddHostedService<DbWatcherService>();
// ── Repositories ─────────────────────────────────────────────
builder.Services.AddScoped<IAchatsRepository, AchatsRepository>();
builder.Services.AddScoped<IOrdreProductionRepository, OrdreProductionRepository>();
builder.Services.AddScoped<IRapportRepository, RapportRepository>();
builder.Services.AddScoped<ProductionRepository>();
builder.Services.AddScoped<RentabiliteRepository>();
// ── Services ─────────────────────────────────────────────────
builder.Services.AddScoped<IAchatsService, AchatsService>();
builder.Services.AddScoped<IRapportService, RapportService>();
builder.Services.AddScoped<IQualiteService, QualiteService>();
// ── Repositories ─────────────────────────────────────────────
builder.Services.AddScoped<IAchatsRepository, AchatsRepository>();
builder.Services.AddScoped<IOrdreProductionRepository, OrdreProductionRepository>();
builder.Services.AddScoped<IRapportRepository, RapportRepository>();
builder.Services.AddScoped<IHistoriqueRepository, HistoriqueRepository>();
builder.Services.AddScoped<IHistoriqueService,    HistoriqueService>();

// ── Services ─────────────────────────────────────────────────
builder.Services.AddScoped<IAchatsService, AchatsService>();
builder.Services.AddScoped<IEmailService, EmailService>();  
builder.Services.AddScoped<SmsService>(); // ← ajoutez ici    
builder.Services.AddScoped<IRapportService, RapportService>();
builder.Services.AddScoped<IOrdreProductionService, OrdreProductionService>();
builder.Services.AddScoped<IQualiteService, QualiteService>();
builder.Services.AddScoped<IStockService, StockService>();
builder.Services.AddScoped<IChiffreAffairesService, ChiffreAffairesService>();
// Repositories
builder.Services.AddScoped<ITempsArretRepository, TempsArretRepository>();

// Services
builder.Services.AddScoped<ITempsArretService, TempsArretService>();
// ── Build ────────────────────────────────────────────────────
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

// ── SignalR Hubs ─────────────────────────────────────────────
app.MapHub<ProductionHub>("/hubs/production");
app.MapHub<DashboardHub>("/hubs/dashboard");
app.Run();