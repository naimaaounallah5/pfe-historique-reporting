using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using WAS_backend.Data;
using WAS_backend.Hubs;

namespace WAS_backend.Services;

public class ProductionWatcherService : BackgroundService
{
    private readonly IServiceScopeFactory      _scopeFactory;
    private readonly IHubContext<ProductionHub> _hub;
    private readonly ILogger<ProductionWatcherService> _logger;

    // ── Mémoriser le dernier état connu ──────────────────────
    private int       _dernierTotal    = -1;
    private DateTime? _derniereDateMAJ = null; // ✅ DateTime? au lieu de DateTime

    public ProductionWatcherService(
        IServiceScopeFactory scopeFactory,
        IHubContext<ProductionHub> hub,
        ILogger<ProductionWatcherService> logger)
    {
        _scopeFactory = scopeFactory;
        _hub          = hub;
        _logger       = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[Watcher] Démarrage surveillance ordres de production...");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await VerifierChangements();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Watcher] Erreur lors de la vérification");
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

    private async Task VerifierChangements()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var total = await db.OrdresProduction.CountAsync();

        var dernierOrdre = await db.OrdresProduction
            .OrderByDescending(o => o.DateCreation)
            .Select(o => (DateTime?)o.DateCreation) // ✅ cast DateTime?
            .FirstOrDefaultAsync();

        bool aChange = total != _dernierTotal || dernierOrdre != _derniereDateMAJ;

        if (aChange)
        {
            _logger.LogInformation(
                "[Watcher] Changement détecté ! Total: {total} (avant: {avant}) → Notification SignalR",
                total, _dernierTotal);

            await _hub.Clients.All.SendAsync("OrdresMisAJour");

            _dernierTotal    = total;
            _derniereDateMAJ = dernierOrdre;
        }
        else
        {
            _logger.LogDebug("[Watcher] Aucun changement détecté.");
        }
    }
}