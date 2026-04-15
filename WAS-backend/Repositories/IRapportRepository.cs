using WAS_backend.Models;

namespace WAS_backend.Repositories;

public interface IRapportRepository
{
    Task<List<Rapport>> GetAllAsync(string? search, string? type, string? statut, string? format);
    Task<Rapport?>      GetByIdAsync(int id);
    Task<Rapport>       CreateAsync(Rapport rapport);
    Task<Rapport?>      UpdateAsync(Rapport rapport);
    Task<bool>          DeleteAsync(int id);
    Task                AddEnvoiAsync(RapportEnvoi envoi);
}