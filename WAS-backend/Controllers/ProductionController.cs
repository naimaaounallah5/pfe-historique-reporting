using Microsoft.AspNetCore.Mvc;
using WAS_backend.Repositories;

namespace WAS_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductionController : ControllerBase
    {
        private readonly ProductionRepository _repo;
        public ProductionController(ProductionRepository repo) { _repo = repo; }

        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] int? annee     = null,
            [FromQuery] int? trimestre = null,
            [FromQuery] int? produitId = null,
            [FromQuery] int? machineId = null)
        {
            var result = await _repo.GetProductionResponseAsync(
                annee, trimestre, produitId, machineId);
            return Ok(result);
        }
    }
}