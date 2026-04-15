using WAS_backend.DTOs;
using WAS_backend.Models;

namespace WAS_backend.Services;

public interface IRapportService
{
    Task<List<Rapport>>  GetAllAsync(string? search, string? type, string? statut, string? format);
    Task<Rapport?>       GetByIdAsync(int id);
    Task<Rapport>        CreateAsync(CreateRapportDTO dto);
    Task<bool>           DeleteAsync(int id);
    Task<byte[]>         GeneratePdfAsync(int id, int seq = 0);   // ✅ CORRIGÉ
    Task<byte[]>         GenerateCsvAsync(int id);
    Task<byte[]>         GenerateExcelAsync(int id, int seq = 0); // ✅ CORRIGÉ
    Task<byte[]>         ExportAllPdfAsync();
    Task<byte[]>         ExportAllExcelAsync();
    Task                 EnvoyerAsync(int id, EnvoyerRapportDTO dto);
}