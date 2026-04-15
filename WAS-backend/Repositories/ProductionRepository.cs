// WAS-backend/Repositories/ProductionRepository.cs
using Microsoft.EntityFrameworkCore;
using WAS_backend.Data;
using WAS_backend.DTOs;

namespace WAS_backend.Repositories
{
    public class ProductionRepository
    {
        private readonly AppDbContext _db;
        public ProductionRepository(AppDbContext db) { _db = db; }

        public async Task<ProductionResponseDTO> GetProductionResponseAsync(
            int? annee = null, int? trimestre = null,
            int? produitId = null, int? machineId = null)
        {
            try
            {
                var query = from f in _db.FaitProduction
                            join t in _db.DimTemps on f.IdTemps equals t.IdTemps
                            join p in _db.DimProduits on f.IdProduit equals p.IdProduit
                            join m in _db.DimMachines on f.IdMachine equals m.IdMachine
                            select new {
                                NbHeureMachine = (double?)f.NbHeureMachine ?? 0,
                                MtMatierePremiere = (double?)f.MtMatierePremiere ?? 0,
                                CoutUnitaireHeure = (double?)f.CoutUnitaireHeure ?? 0,
                                QuantiteProduite = (double?)f.QuantiteProduite ?? 0,
                                CoutMachine = ((double?)f.NbHeureMachine ?? 0) * ((double?)f.CoutUnitaireHeure ?? 0),
                                CoutTotal = ((double?)f.NbHeureMachine ?? 0) * ((double?)f.CoutUnitaireHeure ?? 0) + ((double?)f.MtMatierePremiere ?? 0),
                                t.Mois, t.Trimestre, t.Annee,
                                Produit = p.Description ?? "",
                                Categorie = p.Categorie ?? "",
                                IdProduit = (int?)p.IdProduit,
                                Machine = m.Nom ?? "",
                                Groupe = m.Groupe ?? "",
                                Site = m.Site ?? "",
                                IdMachine = (int?)m.IdMachine,
                            };

                if (annee != null) query = query.Where(x => x.Annee == annee);
                if (trimestre != null) query = query.Where(x => x.Trimestre == trimestre);
                if (produitId != null) query = query.Where(x => x.IdProduit == produitId);
                if (machineId != null) query = query.Where(x => x.IdMachine == machineId);

                var data = await query.ToListAsync();

                if (data == null || !data.Any())
                {
                    return new ProductionResponseDTO
                    {
                        Kpi = new ProductionKpiDTO(),
                        ParTemps = new List<CoutParTempsDTO>(),
                        ParProduit = new List<CoutParProduitDTO>(),
                        ParMachine = new List<CoutParMachineDTO>()
                    };
                }

                // ── KPI global ───────────────────────────────────────────
                var kpi = new ProductionKpiDTO
                {
                    CoutTotalProduction = Math.Round(data.Sum(x => x.CoutTotal), 2),
                    CoutTotalMatiere = Math.Round(data.Sum(x => x.MtMatierePremiere), 2),
                    CoutTotalMachine = Math.Round(data.Sum(x => x.CoutMachine), 2),
                    NombreOrdres = data.Count,
                    CoutMoyenParOrdre = data.Count > 0
                        ? Math.Round(data.Average(x => x.CoutTotal), 2) : 0,
                };

                // ── Par Temps ────────────────────────────────────────────
                var parTemps = data
                    .GroupBy(x => new { x.Annee, x.Trimestre, x.Mois })
                    .Select(g => new CoutParTempsDTO
                    {
                        Label = g.Key.Mois.ToString("00") + "/" + g.Key.Annee,
                        Mois = g.Key.Mois,
                        Trimestre = g.Key.Trimestre,
                        Annee = g.Key.Annee,
                        CoutTotal = Math.Round(g.Sum(x => x.CoutTotal), 2),
                        CoutMatiere = Math.Round(g.Sum(x => x.MtMatierePremiere), 2),
                        CoutMachine = Math.Round(g.Sum(x => x.CoutMachine), 2),
                        NombreOrdres = g.Count(),
                    })
                    .OrderBy(x => x.Annee).ThenBy(x => x.Mois)
                    .ToList();

                // ── Par Produit ──────────────────────────────────────────
                var parProduit = data
                    .GroupBy(x => new { x.Produit, x.Categorie })
                    .Select(g => new CoutParProduitDTO
                    {
                        Produit = g.Key.Produit ?? "",
                        Categorie = g.Key.Categorie ?? "",
                        CoutTotal = Math.Round(g.Sum(x => x.CoutTotal), 2),
                        CoutMatiere = Math.Round(g.Sum(x => x.MtMatierePremiere), 2),
                        CoutMachine = Math.Round(g.Sum(x => x.CoutMachine), 2),
                        NombreOrdres = g.Count(),
                        QuantiteProduite = (int)g.Sum(x => x.QuantiteProduite),
                    })
                    .OrderByDescending(x => x.CoutTotal)
                    .ToList();

                // ── Par Machine ──────────────────────────────────────────
                var parMachine = data
                    .GroupBy(x => new { x.Machine, x.Groupe, x.Site })
                    .Select(g => new CoutParMachineDTO
                    {
                        Machine = g.Key.Machine ?? "",
                        Groupe = g.Key.Groupe ?? "",
                        Site = g.Key.Site ?? "",
                        CoutTotal = Math.Round(g.Sum(x => x.CoutTotal), 2),
                        CoutMachine = Math.Round(g.Sum(x => x.CoutMachine), 2),
                        HeuresMachine = Math.Round(g.Sum(x => x.NbHeureMachine), 2),
                        NombreOrdres = g.Count(),
                    })
                    .OrderByDescending(x => x.CoutTotal)
                    .ToList();

                return new ProductionResponseDTO
                {
                    Kpi = kpi,
                    ParTemps = parTemps,
                    ParProduit = parProduit,
                    ParMachine = parMachine,
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erreur dans ProductionRepository: {ex.Message}");
                Console.WriteLine($"❌ StackTrace: {ex.StackTrace}");
                
                return new ProductionResponseDTO
                {
                    Kpi = new ProductionKpiDTO(),
                    ParTemps = new List<CoutParTempsDTO>(),
                    ParProduit = new List<CoutParProduitDTO>(),
                    ParMachine = new List<CoutParMachineDTO>()
                };
            }
        }
    }
}