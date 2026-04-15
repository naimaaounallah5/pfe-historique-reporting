// WAS-backend/Controllers/StockController.cs
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
    public class StockController : ControllerBase
    {
        private readonly IStockService _stockService;
        private readonly IHubContext<DashboardHub> _hubContext;

        public StockController(
            IStockService stockService,
            IHubContext<DashboardHub> hubContext)
        {
            _stockService = stockService;
            _hubContext = hubContext;
        }

        [HttpGet("dashboard")]
        public async Task<ActionResult<StockResponse>> GetDashboard(
            [FromQuery] int? annee = null,
            [FromQuery] int? trimestre = null,
            [FromQuery] string? produit = null,
            [FromQuery] string? categorie = null)
        {
            var queryParams = new StockQueryParams
            {
                Annee = annee,
                Trimestre = trimestre,
                Produit = produit,
                Categorie = categorie
            };

            var result = await _stockService.GetStock(queryParams);
            return Ok(result);
        }

        [HttpPost("notify-update")]
        public async Task<IActionResult> NotifyUpdate()
        {
            await _hubContext.Clients.All.SendAsync("DashboardMisAJour");
            return Ok(new { message = "Notification envoyée" });
        }

        [HttpPost("recalculer-stock")]
        public async Task<IActionResult> RecalculerStock()
        {
            await _stockService.MettreAJourStock();
            await _hubContext.Clients.All.SendAsync("DashboardMisAJour");
            return Ok(new { message = "Stock recalculé et base mise à jour" });
        }
    }
}