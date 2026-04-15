using Microsoft.AspNetCore.Mvc;
using WAS_backend.DTOs;
using WAS_backend.Services;

namespace WAS_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TempsArretController : ControllerBase
    {
        private readonly ITempsArretService _tempsArretService;

        public TempsArretController(ITempsArretService tempsArretService)
        {
            _tempsArretService = tempsArretService;
        }

        [HttpGet("dashboard")]
        public async Task<ActionResult<TempsArretResponseDTO>> GetDashboard(
            [FromQuery] int? machineId = null,
            [FromQuery] int? produitId = null,
            [FromQuery] int? annee = null,
            [FromQuery] int? trimestre = null)
        {
            var queryParams = new TempsArretQueryParams
            {
                MachineId = machineId,
                ProduitId = produitId,
                Annee = annee,
                Trimestre = trimestre
            };

            var result = await _tempsArretService.GetTempsArret(queryParams);
            return Ok(result);
        }
    }
}