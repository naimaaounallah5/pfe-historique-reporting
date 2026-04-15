using WAS_backend.DTOs;

namespace WAS_backend.Services
{
    public interface IHistoriqueService
    {
        // ── SCADA ────────────────────────────────────────────
        Task<HistoriquePageResult<HistoriqueSCADADto>> GetSCADAAsync(HistoriqueQueryParams p);
        Task<HistoriqueSCADADto?>                      GetSCADAByIdAsync(int id);
        Task<List<HistoriqueSCADADto>>                 ExportSCADAAsync(HistoriqueQueryParams p);

        // ── WMS ──────────────────────────────────────────────
        Task<HistoriquePageResult<HistoriqueWMSDto>>   GetWMSAsync(HistoriqueQueryParams p);
        Task<HistoriqueWMSDto?>                        GetWMSByIdAsync(int id);
        Task<List<HistoriqueWMSDto>>                   ExportWMSAsync(HistoriqueQueryParams p);

        // ── QDC ──────────────────────────────────────────────
        Task<HistoriquePageResult<HistoriqueQDCDto>>   GetQDCAsync(HistoriqueQueryParams p);
        Task<HistoriqueQDCDto?>                        GetQDCByIdAsync(int id);
        Task<List<HistoriqueQDCDto>>                   ExportQDCAsync(HistoriqueQueryParams p);

        // ── AGV ──────────────────────────────────────────────
        Task<HistoriquePageResult<HistoriqueAGVDto>>   GetAGVAsync(HistoriqueQueryParams p);
        Task<HistoriqueAGVDto?>                        GetAGVByIdAsync(int id);
        Task<List<HistoriqueAGVDto>>                   ExportAGVAsync(HistoriqueQueryParams p);
    }
}