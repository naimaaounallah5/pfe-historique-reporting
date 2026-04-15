// ============================================================
//  DbWatcherService.cs — Surveillance automatique de la DB
// ============================================================

using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using WAS_backend.Data;
using WAS_backend.Hubs;

namespace WAS_backend.Services
{
    public class DbWatcherService : BackgroundService
    {
        private readonly IServiceScopeFactory      _scopeFactory;
        private readonly IHubContext<DashboardHub> _dashHub;
        private readonly ILogger<DbWatcherService> _logger;

        private readonly TimeSpan _intervalle = TimeSpan.FromSeconds(10);
        private Dictionary<string, int> _comptesPrecedents = new();
        private bool _etlEnCours = false;

        private const string PYTHON_EXE = @"C:\Users\LENOVO\AppData\Local\Programs\Python\Python313\python.exe";
        private const string ETL_SCRIPT = @"C:\pfe-develloppement\ETL_WAS\main.py";

        private static string Now() =>
            DateTime.Now.ToString("dd/MM/yyyy à HH:mm:ss");

        public DbWatcherService(
            IServiceScopeFactory      scopeFactory,
            IHubContext<DashboardHub> dashHub,
            ILogger<DbWatcherService> logger)
        {
            _scopeFactory = scopeFactory;
            _dashHub      = dashHub;
            _logger       = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("👁️  DbWatcher démarré — vérification toutes les 10 secondes");
            _logger.LogInformation("🐍 Python  : {Exe}", PYTHON_EXE);
            _logger.LogInformation("📄 Script  : {Script}", ETL_SCRIPT);
            _logger.LogInformation("🕐 Démarrage : {Now}", Now());

            _comptesPrecedents = await CompterLignes();

            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(_intervalle, stoppingToken);

                if (_etlEnCours) continue;

                try
                {
                    var comptesActuels     = await CompterLignes();
                    bool changementDetecte = false;

                    foreach (var (table, nbActuel) in comptesActuels)
                    {
                        var nbPrecedent = _comptesPrecedents.GetValueOrDefault(table, 0);
                        if (nbActuel != nbPrecedent)
                        {
                            var diff = nbActuel - nbPrecedent;
                            _logger.LogInformation(
                                "🔔 [{Now}] Changement détecté : {Table} ({Diff:+#;-#;0} lignes)",
                                Now(), table, diff);
                            changementDetecte = true;
                        }
                    }

                    if (changementDetecte)
                    {
                        await LancerEtlPython();
                        await RecalculerKpis();
                        await Task.Delay(2000, stoppingToken);
                        _comptesPrecedents = await CompterLignes();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError("❌ [{Now}] Erreur watcher : {Message}", Now(), ex.Message);
                }
            }

            _logger.LogInformation("⛔ [{Now}] DbWatcher arrêté.", Now());
        }

        private async Task LancerEtlPython()
        {
            _etlEnCours = true;
            var debut   = DateTime.Now;

            _logger.LogInformation("==================================================");
            _logger.LogInformation("🚀 [{Now}] ETL Python démarré...", Now());
            _logger.LogInformation("==================================================");

            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName               = PYTHON_EXE,
                    Arguments              = $"\"{ETL_SCRIPT}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError  = true,
                    UseShellExecute        = false,
                    CreateNoWindow         = true,
                };

                using var process = Process.Start(psi)!;
                string output = await process.StandardOutput.ReadToEndAsync();
                string errors = await process.StandardError.ReadToEndAsync();
                await process.WaitForExitAsync();

                if (!string.IsNullOrWhiteSpace(output))
                {
                    foreach (var line in output.Split('\n'))
                        if (!string.IsNullOrWhiteSpace(line))
                            _logger.LogInformation("   🐍 {Line}", line.TrimEnd());
                }

                var duree = (DateTime.Now - debut).TotalSeconds;

                if (process.ExitCode == 0)
                    _logger.LogInformation(
                        "✅ [{Now}] ETL Python terminé avec succès — durée : {Duree:F1}s",
                        Now(), duree);
                else
                {
                    _logger.LogWarning(
                        "⚠️  [{Now}] ETL Python erreur (code {Code}) — durée : {Duree:F1}s",
                        Now(), process.ExitCode, duree);
                    if (!string.IsNullOrWhiteSpace(errors))
                        _logger.LogError("❌ Erreur Python : {Errors}", errors);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ [{Now}] Impossible de lancer Python : {Message}", Now(), ex.Message);
            }
            finally
            {
                _etlEnCours = false;
            }
        }

        private async Task<Dictionary<string, int>> CompterLignes()
        {
            using var scope   = _scopeFactory.CreateScope();
            var       context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            return new Dictionary<string, int>
            {
                ["DIM_Client"]      = await context.DimClients.CountAsync(),
                ["DIM_Fournisseur"] = await context.DimFournisseurs.CountAsync(),
                ["DIM_Temps"]       = await context.DimTemps.CountAsync(),
                ["DIM_Produit"]     = await context.DimProduits.CountAsync(),
                ["DIM_Machine"]     = await context.DimMachines.CountAsync(),
                ["FAIT_Achats"]     = await context.FaitAchats.CountAsync(),
                ["FAIT_Ventes"]     = await context.FaitVentes.CountAsync(),
                ["FAIT_Production"] = await context.FaitProduction.CountAsync(),
                ["FAIT_Qualite"]    = await context.FaitQualite.CountAsync(),
                ["FAIT_Stock"]      = await context.FaitStock.CountAsync(),
                ["HistoriqueSCADA"] = await context.HistoriqueSCADA.CountAsync(),
                ["HistoriqueWMS"]   = await context.HistoriqueWMS.CountAsync(),
                ["HistoriqueQDC"]   = await context.HistoriqueQDC.CountAsync(),
                ["HistoriqueAGV"]   = await context.HistoriqueAGV.CountAsync(),
            };
        }

        private async Task RecalculerKpis()
        {
            var debut = DateTime.Now;
            _logger.LogInformation("🔄 [{Now}] Recalcul des KPIs...", Now());

            using var scope   = _scopeFactory.CreateScope();
            var       context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var qualiteService = scope.ServiceProvider.GetRequiredService<IQualiteService>();
            await qualiteService.MettreAJourTauxDefaut();

            // ── Achats ───────────────────────────────────────────────
            var achatsLignes = await context.FaitAchats.ToListAsync();
            foreach (var ligne in achatsLignes)
            {
                ligne.MontantTotalAchats = ligne.QteCommandee * ligne.PrixUnitaireAchat;
                ligne.RetardLivraison    = ligne.DelaiLivraisonReel - ligne.DelaiLivraisonConvenu;
            }

            // ── Ventes ───────────────────────────────────────────────
            var ventesLignes = await context.FaitVentes
                .Where(v => v.ChiffreAffaires == null ||
                       v.ChiffreAffaires != v.QteVendue * v.PrixVenteUnitaire)
                .ToListAsync();

            if (ventesLignes.Any())
            {
                _logger.LogInformation("📝 [{Now}] Mise à jour de {Count} lignes FAIT_Ventes", Now(), ventesLignes.Count);
                foreach (var vente in ventesLignes)
                    vente.ChiffreAffaires = vente.QteVendue * vente.PrixVenteUnitaire;
            }

            // ── Stock ────────────────────────────────────────────────
            int compteurStock = 0;
            try
            {
                var stockLignes = await context.FaitStock.ToListAsync();
                foreach (var stock in stockLignes)
                {
                    var ancienDispo    = stock.StockDisponible;
                    stock.StockDisponible = stock.StockEntree - stock.StockSortie;
                    if (ancienDispo != stock.StockDisponible)
                        compteurStock++;
                }
                if (compteurStock > 0)
                    _logger.LogInformation("📝 [{Now}] {Count} lignes FAIT_Stock mises à jour", Now(), compteurStock);
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Erreur stock: {Msg}", ex.Message);
            }

            // ── Production ───────────────────────────────────────────
            int compteurProd = 0;
            try
            {
                var prodLignes = await context.FaitProduction
                    .Include(p => p.DimMachine)
                    .ToListAsync();

                foreach (var prod in prodLignes)
                {
                    var ancienCout        = prod.CoutProduction;
                    var ancienRentabilite = prod.RentabiliteMachine;
                    var ancienTempsArret  = prod.TempsArret;

                    // ── Coût Production — toujours recalculé ─────────
                    prod.CoutProduction = Math.Round(
                        (prod.NbHeureMachine * prod.CoutUnitaireHeure) + prod.MtMatierePremiere, 2);

                    // ── Rentabilité — NE PAS écraser si déjà renseignée manuellement ──
                    if (prod.RentabiliteMachine == null || prod.RentabiliteMachine == 0)
                    {
                        try
                        {
                            var ventesProduit = await context.FaitVentes
                                .Where(v => v.IdProduit == prod.IdProduit)
                                .ToListAsync();

                            if (ventesProduit.Any())
                            {
                                double prixMoyen       = ventesProduit.Average(v => (double)v.PrixVenteUnitaire);
                                double revenuPotentiel = prod.QuantiteProduite * prixMoyen;
                                double coutMachine     = prod.NbHeureMachine * prod.CoutUnitaireHeure;

                                if (coutMachine > 0)
                                    prod.RentabiliteMachine = Math.Round(
                                        (revenuPotentiel / coutMachine) * 100, 2);
                            }
                        }
                        catch (Exception exRent)
                        {
                            _logger.LogWarning("⚠️ Rentabilité prod {Id}: {Msg}",
                                prod.IdProduction, exRent.Message);
                        }
                    }

                    // ── Temps Arrêt — toujours recalculé ────────────
                    if (prod.DimMachine != null && prod.DimMachine.CapaciteMinutes > 0)
                    {
                        double tempsArretDouble = (prod.NbHeureMachine * 60.0) - prod.DimMachine.CapaciteMinutes;
                        prod.TempsArret = (int)Math.Max(0, Math.Round(tempsArretDouble));
                    }

                    if (ancienCout        != prod.CoutProduction    ||
                        ancienRentabilite != prod.RentabiliteMachine ||
                        ancienTempsArret  != prod.TempsArret)
                        compteurProd++;
                }

                if (compteurProd > 0)
                    _logger.LogInformation("📝 [{Now}] {Count} lignes FAIT_Production mises à jour",
                        Now(), compteurProd);
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Erreur production: {Msg}", ex.Message);
                _logger.LogError("StackTrace: {Stack}", ex.StackTrace);
            }

            await context.SaveChangesAsync();

            var duree = (DateTime.Now - debut).TotalSeconds;
            _logger.LogInformation(
                "✅ [{Now}] KPIs recalculés — Achats: {Achats} | Ventes: {Ventes} | Stock: {Stock} | Production: {Prod} | Qualité: OK — durée: {Duree:F2}s",
                Now(), achatsLignes.Count, ventesLignes.Count, compteurStock, compteurProd, duree);

            await _dashHub.Clients.All.SendAsync("DashboardMisAJour");
            await _dashHub.Clients.All.SendAsync("HistoriqueMisAJour");
            _logger.LogInformation("🟢 [{Now}] SignalR → Dashboard + Historique mis à jour !", Now());
        }
    }
}