// WAS-backend/Services/StockService.cs
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WAS_backend.Data;
using WAS_backend.DTOs;
using WAS_backend.Models;

namespace WAS_backend.Services
{
    public interface IStockService
    {
        Task<StockResponse> GetStock(StockQueryParams queryParams);
        Task MettreAJourStock();
    }

    public class StockService : IStockService
    {
        private readonly AppDbContext _context;

        public StockService(AppDbContext context)
        {
            _context = context;
        }

        public async Task MettreAJourStock()
        {
            var stocks = await _context.FaitStock.ToListAsync();

            foreach (var stock in stocks)
            {
                stock.StockDisponible = stock.StockEntree - stock.StockSortie;
            }

            await _context.SaveChangesAsync();
            Console.WriteLine($"✅ {stocks.Count} enregistrements Stock mis à jour");
        }

        public async Task<StockResponse> GetStock(StockQueryParams queryParams)
        {
            var query = _context.FaitStock
                .Include(f => f.DimProduit)
                .Include(f => f.DimTemps)
                .AsQueryable();

            if (queryParams.Annee.HasValue)
                query = query.Where(f => f.DimTemps != null && f.DimTemps.Annee == queryParams.Annee);

            if (queryParams.Trimestre.HasValue)
                query = query.Where(f => f.DimTemps != null && f.DimTemps.Trimestre == queryParams.Trimestre);

            if (!string.IsNullOrEmpty(queryParams.Produit))
                query = query.Where(f => f.DimProduit != null && f.DimProduit.Description == queryParams.Produit);

            if (!string.IsNullOrEmpty(queryParams.Categorie))
                query = query.Where(f => f.DimProduit != null && f.DimProduit.Categorie == queryParams.Categorie);

            var data = await query.ToListAsync();

            // Mettre à jour les stocks si nécessaire
            var lignesSansStock = data.Where(f => !f.StockDisponible.HasValue).ToList();
            if (lignesSansStock.Any())
            {
                foreach (var stock in lignesSansStock)
                {
                    stock.StockDisponible = stock.StockEntree - stock.StockSortie;
                }
                await _context.SaveChangesAsync();
            }

            if (!data.Any())
            {
                return new StockResponse();
            }

            // Calcul des KPIs globaux
            var global = new StockGlobal
            {
                EntreesTotales   = data.Sum(f => f.StockEntree),
                SortiesTotales   = data.Sum(f => f.StockSortie),
                StockTotal       = data.Sum(f => f.StockDisponible ?? 0),
                NombreProduits   = data.Select(f => f.IdProduit).Distinct().Count(),
                ProduitsEnAlerte = data
                    .GroupBy(f => f.IdProduit)
                    .Select(g => g.Sum(f => f.StockDisponible ?? 0))
                    .Count(s => s < 100)
            };

            // Par Produit — ✅ TypeProduit ajouté dans le GroupBy et le Select
            var parProduit = data
                .Where(f => f.DimProduit != null)
                .GroupBy(f => new {
                    f.DimProduit!.Description,
                    f.DimProduit!.Categorie,
                    f.DimProduit!.Groupe,
                    f.DimProduit!.TypeProduit  // ✅ ajouté ici
                })
                .Select(g => new StockParProduit
                {
                    Produit         = g.Key.Description,
                    Description     = g.Key.Description,
                    Categorie       = g.Key.Categorie   ?? "Non catégorisé",
                    Groupe          = g.Key.Groupe       ?? "Non groupé",
                    TypeProduit     = g.Key.TypeProduit  ?? "Non défini",  // ✅ ajouté ici
                    Entrees         = g.Sum(f => f.StockEntree),
                    Sorties         = g.Sum(f => f.StockSortie),
                    StockDisponible = g.Sum(f => f.StockDisponible ?? 0),
                    EstEnAlerte     = g.Sum(f => f.StockDisponible ?? 0) < 100
                })
                .OrderBy(p => p.StockDisponible)
                .ToList();

            // Par Temps
            var parTemps = data
                .Where(f => f.DimTemps != null)
                .GroupBy(f => new {
                    f.DimTemps!.Mois,
                    f.DimTemps!.Trimestre,
                    f.DimTemps!.Annee
                })
                .Select(g => new StockParTemps
                {
                    Label      = GetMonthLabel(g.Key.Mois, g.Key.Annee),
                    Mois       = g.Key.Mois,
                    Trimestre  = g.Key.Trimestre,
                    Annee      = g.Key.Annee,
                    Entrees    = g.Sum(f => f.StockEntree),
                    Sorties    = g.Sum(f => f.StockSortie),
                    StockMoyen = g.Average(f => f.StockDisponible ?? 0)
                })
                .OrderBy(t => t.Annee)
                .ThenBy(t => t.Mois)
                .ToList();

            return new StockResponse
            {
                Global     = global,
                ParProduit = parProduit,
                ParTemps   = parTemps
            };
        }

        private string GetMonthLabel(int mois, int annee)
        {
            string[] moisNoms = { "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
                                  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc" };
            return $"{moisNoms[mois - 1]} {annee}";
        }
    }
}
