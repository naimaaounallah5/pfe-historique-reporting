using Microsoft.AspNetCore.Mvc;
using WAS_backend.Repositories;

namespace WAS_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RentabiliteController : ControllerBase
    {
        private readonly RentabiliteRepository _repo;
        public RentabiliteController(RentabiliteRepository repo) { _repo = repo; }

        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] int? annee     = null,
            [FromQuery] int? trimestre = null,
            [FromQuery] int? produitId = null,
            [FromQuery] int? machineId = null)
        {
            var result = await _repo.GetRentabiliteAsync(
                annee, trimestre, produitId, machineId);
            return Ok(result);
        }
    }
}