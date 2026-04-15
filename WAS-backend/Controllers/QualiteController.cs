// WAS-backend/Controllers/QualiteController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using WAS_backend.DTOs;
using WAS_backend.Hubs;
using WAS_backend.Services;

namespace WAS_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QualiteController : ControllerBase
    {
        private readonly IQualiteService _qualiteService;
        private readonly IHubContext<DashboardHub> _hubContext;

        public QualiteController(
            IQualiteService qualiteService,
            IHubContext<DashboardHub> hubContext)
        {
            _qualiteService = qualiteService;
            _hubContext = hubContext;
        }

        [HttpGet("dashboard")]
        public async Task<ActionResult<QualiteResponse>> GetDashboard(
            [FromQuery] int? annee = null,
            [FromQuery] int? trimestre = null,
            [FromQuery] string? produit = null,
            [FromQuery] string? machine = null,
            [FromQuery] string? categorie = null)
        {
            var queryParams = new QualiteQueryParams
            {
                Annee = annee,
                Trimestre = trimestre,
                Produit = produit,
                Machine = machine,
                Categorie = categorie
            };

            var result = await _qualiteService.GetTauxDefaut(queryParams);
            return Ok(result);
        }

        [HttpPost("notify-update")]
        public async Task<IActionResult> NotifyUpdate()
        {
            await _hubContext.Clients.All.SendAsync("DashboardMisAJour");
            return Ok(new { message = "Notification envoyée" });
        }

        [HttpPost("recalculer-taux")]
        public async Task<IActionResult> RecalculerTaux()
        {
            await _qualiteService.MettreAJourTauxDefaut();
            await _hubContext.Clients.All.SendAsync("DashboardMisAJour");
            return Ok(new { message = "Taux de défaut recalculés et base mise à jour" });
        }
    }
}