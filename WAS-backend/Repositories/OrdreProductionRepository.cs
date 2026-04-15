using Microsoft.EntityFrameworkCore;
using WAS_backend.Data;
using WAS_backend.DTOs;
using WAS_backend.Models;

namespace WAS_backend.Repositories;

public class OrdreProductionRepository : IOrdreProductionRepository
{
    private readonly AppDbContext _db;
    public OrdreProductionRepository(AppDbContext db) => _db = db;

    public async Task<List<OrdreProduction>> GetAllAsync(string? search, int? statut, string? codeSite)
    {
        var query = _db.OrdresProduction.AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(o =>
                o.Numero.Contains(search) ||
                (o.Description != null && o.Description.Contains(search)) ||
                (o.OperateurAssigne != null && o.OperateurAssigne.Contains(search)));

        if (statut.HasValue)
            query = query.Where(o => o.Statut == statut.Value);

        if (!string.IsNullOrEmpty(codeSite))
            query = query.Where(o => o.CodeSite == codeSite);

        return await query.OrderBy(o => o.Id).ToListAsync();
    }

    public async Task<OrdreProductionDetailDTO?> GetDetailAsync(string numero)
    {
        var ordre = await _db.OrdresProduction
            .FirstOrDefaultAsync(o => o.Numero == numero);

        if (ordre == null) return null;

        var lignes     = await GetLignesAsync(numero);
        var composants = await GetComposantsAsync(numero);
        var operations = await GetOperationsAsync(numero);

        return new OrdreProductionDetailDTO
        {
            Ordre      = ordre,
            Lignes     = lignes,
            Composants = composants,
            Operations = operations
        };
    }

    public async Task<OrdreProduction> CreerAsync(OrdreProduction ordre)
    {
        _db.OrdresProduction.Add(ordre);
        await _db.SaveChangesAsync();
        await _db.Entry(ordre).ReloadAsync();
        return ordre;
    }

    public async Task<List<LigneOrdreProduction>> GetLignesAsync(string numero)
    {
        try
        {
            return await _db.LignesOrdreProduction
                .FromSqlRaw(
                    "SELECT * FROM [WAS_DB].[dbo].[LignesOrdreProduction] WHERE NumeroOrdreProduction = {0}",
                    numero)
                .OrderBy(l => l.NumeroLigne)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ GetLignesAsync error: {ex.Message}");
            return new List<LigneOrdreProduction>();
        }
    }

    public async Task<List<ComposantOrdre>> GetComposantsAsync(string numero)
    {
        try
        {
            return await _db.ComposantsOrdre
                .FromSqlRaw(
                    "SELECT * FROM [WAS_DB].[dbo].[ComposantsOrdre] WHERE NumeroOrdreProduction = {0}",
                    numero)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ GetComposantsAsync error: {ex.Message}");
            return new List<ComposantOrdre>();
        }
    }

    public async Task<List<OperationGamme>> GetOperationsAsync(string numero)
    {
        try
        {
            return await _db.OperationsGamme
                .FromSqlRaw(
                    "SELECT * FROM [WAS_DB].[dbo].[OperationsGamme] WHERE NumeroOrdreProduction = {0}",
                    numero)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ GetOperationsAsync error: {ex.Message}");
            return new List<OperationGamme>();
        }
    }
}