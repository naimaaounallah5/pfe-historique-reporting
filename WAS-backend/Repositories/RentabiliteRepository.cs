// WAS-backend/Repositories/RentabiliteRepository.cs
using Microsoft.EntityFrameworkCore;
using WAS_backend.Data;
using WAS_backend.DTOs;

namespace WAS_backend.Repositories
{
    public class RentabiliteRepository
    {
        private readonly AppDbContext _db;
        public RentabiliteRepository(AppDbContext db) { _db = db; }

        public async Task<RentabiliteResponseDTO> GetRentabiliteAsync(
            int? annee = null, int? trimestre = null,
            int? produitId = null, int? machineId = null)
        {
            try
            {
                var query = from f in _db.FaitProduction
                            join t in _db.DimTemps    on f.IdTemps   equals t.IdTemps
                            join p in _db.DimProduits on f.IdProduit equals p.IdProduit
                            join m in _db.DimMachines on f.IdMachine equals m.IdMachine
                            join prixMoy in (
                                from v in _db.FaitVentes
                                group v by v.IdProduit into g
                                select new {
                                    IdProduit = g.Key,
                                    PrixMoyen = g.Average(v => v.PrixVenteUnitaire)
                                }
                            ) on f.IdProduit equals prixMoy.IdProduit into prixJoin
                            from prix in prixJoin.DefaultIfEmpty()
                            select new {
                                NbHeureMachine      = (double?)f.NbHeureMachine      ?? 0,
                                CoutUnitaireHeure   = (double?)f.CoutUnitaireHeure   ?? 0,
                                QuantiteProduite    = (double?)f.QuantiteProduite    ?? 0,
                                MtMatierePremiere   = (double?)f.MtMatierePremiere   ?? 0,

                                // ✅ CoutMachine = NbHeure × CoutHeure
                                CoutMachine = ((double?)f.NbHeureMachine  ?? 0)
                                            * ((double?)f.CoutUnitaireHeure ?? 0),

                                // ✅ CoutTotal = CoutMachine + Mt_Matiere_Premiere
                                CoutTotal = (((double?)f.NbHeureMachine  ?? 0)
                                           * ((double?)f.CoutUnitaireHeure ?? 0))
                                           + ((double?)f.MtMatierePremiere ?? 0),

                                Revenu = prix != null && prix.PrixMoyen != null
                                       ? ((double?)f.QuantiteProduite ?? 0) * (double)prix.PrixMoyen
                                       : 0.0,

                                // ✅ Rentabilite = Revenu / CoutTotal × 100
                                // Priorité : valeur stockée en base si elle existe
                                Rentabilite = (f.RentabiliteMachine != null && f.RentabiliteMachine > 0)
                                    ? (double)f.RentabiliteMachine
                                    : (
                                        // ✅ CoutTotal doit être > 0 et prix disponible
                                        (((double?)f.NbHeureMachine  ?? 0) * ((double?)f.CoutUnitaireHeure ?? 0))
                                        + ((double?)f.MtMatierePremiere ?? 0) > 0
                                        && prix != null && prix.PrixMoyen != null
                                        ? Math.Round(
                                            (((double?)f.QuantiteProduite ?? 0) * (double)prix.PrixMoyen) /
                                            (
                                                (((double?)f.NbHeureMachine  ?? 0) * ((double?)f.CoutUnitaireHeure ?? 0))
                                                + ((double?)f.MtMatierePremiere ?? 0)
                                            ) * 100, 2)
                                        : 0.0
                                      ),

                                t.Mois, t.Trimestre, t.Annee,
                                Produit   = p.Description ?? "",
                                Categorie = p.Categorie   ?? "",
                                IdProduit = (int?)p.IdProduit,
                                Machine   = m.Nom   ?? "",
                                Groupe    = m.Groupe ?? "",
                                Site      = m.Site   ?? "",
                                IdMachine = (int?)m.IdMachine,
                            };

                if (annee     != null) query = query.Where(x => x.Annee     == annee);
                if (trimestre != null) query = query.Where(x => x.Trimestre == trimestre);
                if (produitId != null) query = query.Where(x => x.IdProduit == produitId);
                if (machineId != null) query = query.Where(x => x.IdMachine == machineId);

                var data = await query.ToListAsync();

                if (data == null || !data.Any())
                {
                    return new RentabiliteResponseDTO
                    {
                        Kpi        = new RentabiliteKpiDTO(),
                        ParTemps   = new List<RentabiliteParTempsDTO>(),
                        ParProduit = new List<RentabiliteParProduitDTO>(),
                        ParMachine = new List<RentabiliteParMachineDTO>()
                    };
                }

                // ── KPI Global ───────────────────────────────────────────
                var kpi = new RentabiliteKpiDTO
                {
                    RentabiliteMoyenne     = Math.Round(data.Average(x => x.Rentabilite), 2),
                    NbMachinesRentables    = data.Count(x => x.Rentabilite >= 100),
                    NbMachinesNonRentables = data.Count(x => x.Rentabilite < 100 && x.Rentabilite > 0),
                    NombreOrdres           = data.Count,
                    RevenuTotal            = Math.Round(data.Sum(x => x.Revenu),     2),
                    // ✅ CoutMachineTotal inclut maintenant la matière première
                    CoutMachineTotal       = Math.Round(data.Sum(x => x.CoutTotal),  2),
                };

                // ── Par Temps ────────────────────────────────────────────
                var parTemps = data
                    .GroupBy(x => new { x.Annee, x.Trimestre, x.Mois })
                    .Select(g => new RentabiliteParTempsDTO
                    {
                        Label              = g.Key.Mois.ToString("00") + "/" + g.Key.Annee,
                        Mois               = g.Key.Mois,
                        Trimestre          = g.Key.Trimestre,
                        Annee              = g.Key.Annee,
                        RentabiliteMoyenne = Math.Round(g.Average(x => x.Rentabilite), 2),
                        RevenuTotal        = Math.Round(g.Sum(x => x.Revenu),          2),
                        CoutMachineTotal   = Math.Round(g.Sum(x => x.CoutTotal),       2),
                        NombreOrdres       = g.Count(),
                    })
                    .OrderBy(x => x.Annee).ThenBy(x => x.Mois)
                    .ToList();

                // ── Par Produit ──────────────────────────────────────────
                var parProduit = data
                    .GroupBy(x => new { x.Produit, x.Categorie })
                    .Select(g => new RentabiliteParProduitDTO
                    {
                        Produit            = g.Key.Produit   ?? "",
                        Categorie          = g.Key.Categorie ?? "",
                        RentabiliteMoyenne = Math.Round(g.Average(x => x.Rentabilite), 2),
                        RevenuTotal        = Math.Round(g.Sum(x => x.Revenu),          2),
                        CoutMachineTotal   = Math.Round(g.Sum(x => x.CoutTotal),       2),
                        NombreOrdres       = g.Count(),
                        EstRentable        = g.Average(x => x.Rentabilite) >= 100,
                    })
                    .OrderByDescending(x => x.RentabiliteMoyenne)
                    .ToList();

                // ── Par Machine ──────────────────────────────────────────
                var parMachine = data
                    .GroupBy(x => new { x.Machine, x.Groupe, x.Site })
                    .Select(g => new RentabiliteParMachineDTO
                    {
                        Machine            = g.Key.Machine ?? "",
                        Groupe             = g.Key.Groupe  ?? "",
                        Site               = g.Key.Site    ?? "",
                        RentabiliteMoyenne = Math.Round(g.Average(x => x.Rentabilite), 2),
                        RevenuTotal        = Math.Round(g.Sum(x => x.Revenu),          2),
                        CoutMachineTotal   = Math.Round(g.Sum(x => x.CoutTotal),       2),
                        HeuresMachine      = Math.Round(g.Sum(x => x.NbHeureMachine),  2),
                        NombreOrdres       = g.Count(),
                        EstRentable        = g.Average(x => x.Rentabilite) >= 100,
                    })
                    .OrderByDescending(x => x.RentabiliteMoyenne)
                    .ToList();

                return new RentabiliteResponseDTO
                {
                    Kpi        = kpi,
                    ParTemps   = parTemps,
                    ParProduit = parProduit,
                    ParMachine = parMachine,
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erreur dans RentabiliteRepository: {ex.Message}");
                Console.WriteLine($"❌ StackTrace: {ex.StackTrace}");
                return new RentabiliteResponseDTO
                {
                    Kpi        = new RentabiliteKpiDTO(),
                    ParTemps   = new List<RentabiliteParTempsDTO>(),
                    ParProduit = new List<RentabiliteParProduitDTO>(),
                    ParMachine = new List<RentabiliteParMachineDTO>()
                };
            }
        }
    }
}