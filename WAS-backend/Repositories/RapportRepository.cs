using Microsoft.EntityFrameworkCore;
using WAS_backend.Data;
using WAS_backend.Models;

namespace WAS_backend.Repositories;

public class RapportRepository : IRapportRepository
{
    private readonly AppDbContext _db;

    public RapportRepository(AppDbContext db) => _db = db;

    public async Task<List<Rapport>> GetAllAsync(string? search, string? type, string? statut, string? format)
    {
        var query = _db.Rapports.AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(r => r.Titre.Contains(search));

        if (!string.IsNullOrEmpty(type))
            query = query.Where(r => r.Type == type);

        if (!string.IsNullOrEmpty(statut))
            query = query.Where(r => r.Statut == statut);

        if (!string.IsNullOrEmpty(format))
            query = query.Where(r => r.Format == format);

        return await query.OrderByDescending(r => r.DateCreation).ToListAsync();
    }

    public async Task<Rapport?> GetByIdAsync(int id) =>
        await _db.Rapports.FindAsync(id);

    public async Task<Rapport> CreateAsync(Rapport rapport)
    {
        _db.Rapports.Add(rapport);
        await _db.SaveChangesAsync();
        return rapport;
    }

    public async Task<Rapport?> UpdateAsync(Rapport rapport)
    {
        _db.Rapports.Update(rapport);
        await _db.SaveChangesAsync();
        return rapport;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var rapport = await _db.Rapports.FindAsync(id);
        if (rapport == null) return false;
        _db.Rapports.Remove(rapport);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task AddEnvoiAsync(RapportEnvoi envoi)
    {
        _db.RapportEnvois.Add(envoi);
        await _db.SaveChangesAsync();
    }
}