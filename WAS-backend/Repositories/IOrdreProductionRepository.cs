using WAS_backend.DTOs;
using WAS_backend.Models;

namespace WAS_backend.Repositories;

public interface IOrdreProductionRepository
{
    Task<List<OrdreProduction>>    GetAllAsync(string? search, int? statut, string? codeSite);
    Task<OrdreProductionDetailDTO?> GetDetailAsync(string numero);
    Task<List<LigneOrdreProduction>> GetLignesAsync(string numero);
    Task<List<ComposantOrdre>>       GetComposantsAsync(string numero);
    Task<List<OperationGamme>>       GetOperationsAsync(string numero);
    Task<OrdreProduction> CreerAsync(OrdreProduction ordre); // ✅ AJOUT
}