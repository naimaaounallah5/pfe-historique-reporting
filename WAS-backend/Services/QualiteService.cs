// WAS-backend/Services/QualiteService.cs
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
    public interface IQualiteService
    {
        Task<QualiteResponse> GetTauxDefaut(QualiteQueryParams queryParams);
        Task MettreAJourTauxDefaut();
    }

    public class QualiteService : IQualiteService
    {
        private readonly AppDbContext _context;

        public QualiteService(AppDbContext context)
        {
            _context = context;
        }

        public async Task MettreAJourTauxDefaut()
        {
            var faits = await _context.FaitQualite.ToListAsync();
            
            foreach (var fait in faits)
            {
                fait.TauxDefauts = fait.QteProduiteTotal > 0 
                    ? Math.Round(fait.QteDefectueuse / fait.QteProduiteTotal * 100, 2)
                    : 0;
            }

            await _context.SaveChangesAsync();
            Console.WriteLine($"✅ {faits.Count} enregistrements Qualité mis à jour avec Taux_Defauts");
        }

        public async Task<QualiteResponse> GetTauxDefaut(QualiteQueryParams queryParams)
        {
            var query = _context.FaitQualite
                .Include(f => f.DimProduit)
                .Include(f => f.DimTemps)
                .Include(f => f.DimMachine)
                .AsQueryable();

            if (queryParams.Annee.HasValue)
                query = query.Where(f => f.DimTemps != null && f.DimTemps.Annee == queryParams.Annee);

            if (queryParams.Trimestre.HasValue)
                query = query.Where(f => f.DimTemps != null && f.DimTemps.Trimestre == queryParams.Trimestre);

            if (!string.IsNullOrEmpty(queryParams.Produit))
                query = query.Where(f => f.DimProduit != null && f.DimProduit.Description == queryParams.Produit);

            if (!string.IsNullOrEmpty(queryParams.Machine))
                query = query.Where(f => f.DimMachine != null && f.DimMachine.Nom == queryParams.Machine);

            if (!string.IsNullOrEmpty(queryParams.Categorie))
                query = query.Where(f => f.DimProduit != null && f.DimProduit.Categorie == queryParams.Categorie);

            var data = await query.ToListAsync();

            // Mettre à jour les taux pour les nouvelles lignes
            var lignesSansTaux = data.Where(f => !f.TauxDefauts.HasValue).ToList();
            if (lignesSansTaux.Any())
            {
                foreach (var fait in lignesSansTaux)
                {
                    fait.TauxDefauts = fait.QteProduiteTotal > 0 
                        ? Math.Round(fait.QteDefectueuse / fait.QteProduiteTotal * 100, 2)
                        : 0;
                }
                await _context.SaveChangesAsync();
                Console.WriteLine($"✅ {lignesSansTaux.Count} nouvelles lignes Qualité mises à jour");
            }

            var filters = new QualiteFilters
            {
                Annees = await _context.DimTemps.Select(t => t.Annee).Distinct().OrderBy(a => a).ToListAsync(),
                Trimestres = await _context.DimTemps.Select(t => t.Trimestre).Distinct().OrderBy(t => t).ToListAsync(),
                Produits = await _context.DimProduits.Select(p => p.Description).Distinct().OrderBy(p => p).ToListAsync(),
                Machines = await _context.DimMachines.Select(m => m.Nom).Distinct().OrderBy(m => m).ToListAsync(),
                Categories = await _context.DimProduits.Select(p => p.Categorie).Distinct().OrderBy(c => c).ToListAsync()
            };

            if (!data.Any())
            {
                return new QualiteResponse
                {
                    Global = null,
                    ParProduit = new List<DefautParProduit>(),
                    ParTemps = new List<DefautParTemps>(),
                    ParMachine = new List<DefautParMachine>(),
                    Filters = filters
                };
            }

            var totalControles = data.Sum(f => f.QteProduiteTotal);
            var totalDefauts = data.Sum(f => f.QteDefectueuse);

            var global = new TauxDefautGlobal
            {
                NombreProduitsControles = (int)totalControles,
                NombreDefauts = (int)totalDefauts,
                NombreProduitsConformes = (int)(totalControles - totalDefauts),
                TauxDefautMoyen = totalControles > 0 
                    ? Math.Round(totalDefauts / totalControles * 100, 2)
                    : 0,
                TauxConformite = totalControles > 0
                    ? Math.Round((totalControles - totalDefauts) / totalControles * 100, 2)
                    : 0
            };

            var parProduit = data
                .Where(f => f.DimProduit != null)
                .GroupBy(f => new { 
                    Description = f.DimProduit!.Description, 
                    Categorie = f.DimProduit!.Categorie, 
                    Groupe = f.DimProduit!.Groupe 
                })
                .Select(g => new DefautParProduit
                {
                    Produit = g.Key.Description ?? string.Empty,
                    Description = g.Key.Description ?? string.Empty,
                    Categorie = g.Key.Categorie ?? "Non catégorisé",
                    Groupe = g.Key.Groupe ?? "Non groupé",
                    NombreControles = (int)g.Sum(f => f.QteProduiteTotal),
                    NombreDefauts = (int)g.Sum(f => f.QteDefectueuse),
                    TauxDefaut = g.Sum(f => f.QteProduiteTotal) > 0
                        ? Math.Round(g.Sum(f => f.QteDefectueuse) / g.Sum(f => f.QteProduiteTotal) * 100, 2)
                        : 0,
                    TauxConformite = g.Sum(f => f.QteProduiteTotal) > 0
                        ? Math.Round((g.Sum(f => f.QteProduiteTotal) - g.Sum(f => f.QteDefectueuse)) / g.Sum(f => f.QteProduiteTotal) * 100, 2)
                        : 0
                })
                .OrderByDescending(p => p.TauxDefaut)
                .ToList();

            var parTemps = data
                .Where(f => f.DimTemps != null)
                .GroupBy(f => new { 
                    Mois = f.DimTemps!.Mois, 
                    Trimestre = f.DimTemps!.Trimestre, 
                    Annee = f.DimTemps!.Annee 
                })
                .Select(g => new DefautParTemps
                {
                    Label = GetMonthLabel(g.Key.Mois, g.Key.Annee),
                    Mois = g.Key.Mois,
                    Trimestre = g.Key.Trimestre,
                    Annee = g.Key.Annee,
                    NombreControles = (int)g.Sum(f => f.QteProduiteTotal),
                    NombreDefauts = (int)g.Sum(f => f.QteDefectueuse),
                    TauxDefaut = g.Sum(f => f.QteProduiteTotal) > 0
                        ? Math.Round(g.Sum(f => f.QteDefectueuse) / g.Sum(f => f.QteProduiteTotal) * 100, 2)
                        : 0
                })
                .OrderBy(t => t.Annee)
                .ThenBy(t => t.Mois)
                .ToList();

            var parMachine = data
                .Where(f => f.DimMachine != null)
                .GroupBy(f => new { 
                    Nom = f.DimMachine!.Nom, 
                    Groupe = f.DimMachine!.Groupe, 
                    Site = f.DimMachine!.Site 
                })
                .Select(g => new DefautParMachine
                {
                    Machine = g.Key.Nom ?? string.Empty,
                    Groupe = g.Key.Groupe ?? "Non groupé",
                    Site = g.Key.Site ?? "Non défini",
                    NombreControles = (int)g.Sum(f => f.QteProduiteTotal),
                    NombreDefauts = (int)g.Sum(f => f.QteDefectueuse),
                    TauxDefaut = g.Sum(f => f.QteProduiteTotal) > 0
                        ? Math.Round(g.Sum(f => f.QteDefectueuse) / g.Sum(f => f.QteProduiteTotal) * 100, 2)
                        : 0
                })
                .OrderByDescending(m => m.TauxDefaut)
                .ToList();

            return new QualiteResponse
            {
                Global = global,
                ParProduit = parProduit,
                ParTemps = parTemps,
                ParMachine = parMachine,
                Filters = filters
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