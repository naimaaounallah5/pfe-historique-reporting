// WAS-backend/Controllers/ChiffreAffairesController.cs
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
    public class ChiffreAffairesController : ControllerBase
    {
        private readonly IChiffreAffairesService _chiffreAffairesService;
        private readonly IHubContext<DashboardHub> _hubContext;

        public ChiffreAffairesController(
            IChiffreAffairesService chiffreAffairesService,
            IHubContext<DashboardHub> hubContext)
        {
            _chiffreAffairesService = chiffreAffairesService;
            _hubContext = hubContext;
        }

        [HttpGet("dashboard")]
        public async Task<ActionResult<CA_Response>> GetDashboard(
            [FromQuery] int? annee = null,
            [FromQuery] int? trimestre = null,
            [FromQuery] int? clientId = null,
            [FromQuery] int? produitId = null)
        {
            var queryParams = new CA_QueryParams
            {
                Annee = annee,
                Trimestre = trimestre,
                ClientId = clientId,
                ProduitId = produitId
            };

            var result = await _chiffreAffairesService.GetChiffreAffaires(queryParams);
            return Ok(result);
        }
    }
}