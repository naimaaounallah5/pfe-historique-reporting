// ============================================================
//  EtlController.cs — Endpoint appelé par Python ETL
//  Quand l'ETL termine → appelle POST /api/etl/notify
//  Le backend recalcule les KPIs → sauvegarde → SignalR
// ============================================================

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using WAS_backend.Data;
using WAS_backend.Hubs;

namespace WAS_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EtlController : ControllerBase
    {
        private readonly AppDbContext              _context;
        private readonly IHubContext<DashboardHub> _dashHub;

        public EtlController(
            AppDbContext              context,
            IHubContext<DashboardHub> dashHub)
        {
            _context = context;
            _dashHub = dashHub;
        }

        // ============================================================
        // POST /api/etl/notify
        // Appelé par Python ETL quand il termine
        // 1. Recalcule et sauvegarde les KPIs dans FAIT_Achats
        // 2. Notifie le frontend via SignalR
        // ============================================================
        [HttpPost("notify")]
        public async Task<IActionResult> Notify()
        {
            try
            {
                // ── Recalculer et sauvegarder dans FAIT_Achats ───────
                var lignes = await _context.FaitAchats.ToListAsync();

                foreach (var ligne in lignes)
                {
                    // Calcul Montant_Total_Achats = quantité × prix unitaire
                    ligne.MontantTotalAchats = ligne.QteCommandee * ligne.PrixUnitaireAchat;

                    // Calcul Retard_Livraison = délai réel - délai convenu
                    ligne.RetardLivraison = ligne.DelaiLivraisonReel - ligne.DelaiLivraisonConvenu;
                }

                // ── Sauvegarder dans la DB ───────────────────────────
                await _context.SaveChangesAsync();

                // ── Notifier le frontend via SignalR ─────────────────
                await _dashHub.Clients.All.SendAsync("DashboardMisAJour");

                return Ok(new {
                    message = "KPIs recalculés et dashboard mis à jour",
                    lignes  = lignes.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}