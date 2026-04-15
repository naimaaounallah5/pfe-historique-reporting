using WAS_backend.DTOs;
using WAS_backend.Models;

namespace WAS_backend.Services;

public interface IOrdreProductionService
{
    Task<List<OrdreProduction>>     GetAllAsync(string? search, int? statut, string? codeSite);
    Task<OrdreProductionDetailDTO?> GetDetailAsync(string numero);
    Task<OrdreProduction>           CreerAsync(OrdreProduction ordre); // ✅ AJOUT
    Task<byte[]>                    ExportTableauPdfAsync(string? search, int? statut, string? codeSite);
    Task<byte[]>                    ExportTableauExcelAsync(string? search, int? statut, string? codeSite);
    Task<byte[]>                    ExportOrdrePdfAsync(string numero);
    Task<byte[]>                    ExportOrdreExcelAsync(string numero);
}