using WAS_backend.DTOs;
using WAS_backend.Repositories;

namespace WAS_backend.Services
{
    public class HistoriqueService : IHistoriqueService
    {
        private readonly IHistoriqueRepository _repo;

        public HistoriqueService(IHistoriqueRepository repo)
        {
            _repo = repo;
        }

        // ── SCADA ────────────────────────────────────────────
        public Task<HistoriquePageResult<HistoriqueSCADADto>> GetSCADAAsync(HistoriqueQueryParams p)
            => _repo.GetSCADAAsync(p);

        public Task<HistoriqueSCADADto?> GetSCADAByIdAsync(int id)
            => _repo.GetSCADAByIdAsync(id);

        public Task<List<HistoriqueSCADADto>> ExportSCADAAsync(HistoriqueQueryParams p)
            => _repo.ExportSCADAAsync(p);

        // ── WMS ──────────────────────────────────────────────
        public Task<HistoriquePageResult<HistoriqueWMSDto>> GetWMSAsync(HistoriqueQueryParams p)
            => _repo.GetWMSAsync(p);

        public Task<HistoriqueWMSDto?> GetWMSByIdAsync(int id)
            => _repo.GetWMSByIdAsync(id);

        public Task<List<HistoriqueWMSDto>> ExportWMSAsync(HistoriqueQueryParams p)
            => _repo.ExportWMSAsync(p);

        // ── QDC ──────────────────────────────────────────────
        public Task<HistoriquePageResult<HistoriqueQDCDto>> GetQDCAsync(HistoriqueQueryParams p)
            => _repo.GetQDCAsync(p);

        public Task<HistoriqueQDCDto?> GetQDCByIdAsync(int id)
            => _repo.GetQDCByIdAsync(id);

        public Task<List<HistoriqueQDCDto>> ExportQDCAsync(HistoriqueQueryParams p)
            => _repo.ExportQDCAsync(p);

        // ── AGV ──────────────────────────────────────────────
        public Task<HistoriquePageResult<HistoriqueAGVDto>> GetAGVAsync(HistoriqueQueryParams p)
            => _repo.GetAGVAsync(p);

        public Task<HistoriqueAGVDto?> GetAGVByIdAsync(int id)
            => _repo.GetAGVByIdAsync(id);

        public Task<List<HistoriqueAGVDto>> ExportAGVAsync(HistoriqueQueryParams p)
            => _repo.ExportAGVAsync(p);
    }
}