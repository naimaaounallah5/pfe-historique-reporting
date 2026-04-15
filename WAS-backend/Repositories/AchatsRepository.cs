// ============================================================
//  AchatsRepository.cs — Implémentation du Repository Achats
// ============================================================

using Microsoft.EntityFrameworkCore;
using WAS_backend.Data;
using WAS_backend.DTOs;
using WAS_backend.Models;

namespace WAS_backend.Repositories
{
    public class AchatsRepository : IAchatsRepository
    {
        private readonly AppDbContext _context;

        public AchatsRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<AchatsKpiGlobalDTO> GetKpiGlobalAsync(
            int?    annee       = null,
            int?    trimestre   = null,
            string? fournisseur = null,
            string? produit     = null)
        {
            var query = _context.FaitAchats
                .Include(f => f.DimTemps)
                .Include(f => f.DimFournisseur)
                .Include(f => f.DimProduit)
                .AsQueryable();

            query = AppliquerFiltres(query, annee, trimestre, fournisseur, produit);

            var donnees = await query.ToListAsync();

            if (!donnees.Any())
                return new AchatsKpiGlobalDTO();

            var montantTotal      = donnees.Sum(f => f.QteCommandee * f.PrixUnitaireAchat);
            var nombreCommandes   = donnees.Count;
            var nombreRetards     = donnees.Count(f => f.DelaiLivraisonReel > f.DelaiLivraisonConvenu);
            var tauxRetard        = Math.Round((double)nombreRetards / nombreCommandes * 100, 2);
            var delaiMoyenReel    = Math.Round(donnees.Average(f => (double)f.DelaiLivraisonReel), 2);
            var delaiMoyenConvenu = Math.Round(donnees.Average(f => (double)f.DelaiLivraisonConvenu), 2);

            return new AchatsKpiGlobalDTO
            {
                MontantTotalAchats = Math.Round(montantTotal, 2),
                NombreCommandes    = nombreCommandes,
                NombreRetards      = nombreRetards,
                TauxRetard         = tauxRetard,
                DelaiMoyenReel     = delaiMoyenReel,
                DelaiMoyenConvenu  = delaiMoyenConvenu
            };
        }

        public async Task<List<AchatParFournisseurDTO>> GetParFournisseurAsync(
            int?    annee     = null,
            int?    trimestre = null,
            string? produit   = null)
        {
            var query = _context.FaitAchats
                .Include(f => f.DimTemps)
                .Include(f => f.DimFournisseur)
                .Include(f => f.DimProduit)
                .AsQueryable();

            query = AppliquerFiltres(query, annee, trimestre, null, produit);

            var donnees = await query.ToListAsync();

            var result = donnees
                .GroupBy(f => new
                {
                    NomComplet = f.DimFournisseur!.Nom + " " + f.DimFournisseur!.Prenom,
                    Pays       = f.DimFournisseur!.Pays
                })
                .Select(g => new AchatParFournisseurDTO
                {
                    NomFournisseur  = g.Key.NomComplet,
                    Pays            = g.Key.Pays,
                    MontantTotal    = Math.Round(g.Sum(f => f.QteCommandee * f.PrixUnitaireAchat), 2),
                    NombreCommandes = g.Count(),
                    NombreRetards   = g.Count(f => f.DelaiLivraisonReel > f.DelaiLivraisonConvenu)
                })
                .OrderByDescending(x => x.MontantTotal)
                .ToList();

            return result;
        }

        public async Task<List<AchatParTempsDTO>> GetParTempsAsync(
            int?    annee       = null,
            int?    trimestre   = null,
            string? fournisseur = null,
            string? produit     = null)
        {
            var query = _context.FaitAchats
                .Include(f => f.DimTemps)
                .Include(f => f.DimFournisseur)
                .Include(f => f.DimProduit)
                .AsQueryable();

            query = AppliquerFiltres(query, annee, trimestre, fournisseur, produit);

            var donnees = await query.ToListAsync();

            var result = donnees
                .GroupBy(f => new
                {
                    f.DimTemps!.Mois,
                    f.DimTemps!.Trimestre,
                    f.DimTemps!.Annee,
                    f.DimTemps!.LabelMois
                })
                .Select(g => new AchatParTempsDTO
                {
                    Label           = g.Key.LabelMois,
                    Mois            = g.Key.Mois,
                    Trimestre       = g.Key.Trimestre,
                    Annee           = g.Key.Annee,
                    MontantTotal    = Math.Round(g.Sum(f => f.QteCommandee * f.PrixUnitaireAchat), 2),
                    NombreCommandes = g.Count()
                })
                .OrderBy(x => x.Annee)
                .ThenBy(x => x.Mois)
                .ToList();

            return result;
        }

        public async Task<List<AchatParProduitDTO>> GetParProduitAsync(
            int?    annee       = null,
            int?    trimestre   = null,
            string? fournisseur = null)
        {
            var query = _context.FaitAchats
                .Include(f => f.DimTemps)
                .Include(f => f.DimFournisseur)
                .Include(f => f.DimProduit)
                .AsQueryable();

            query = AppliquerFiltres(query, annee, trimestre, fournisseur, null);

            query = query.Where(f => f.DimProduit!.TypeProduit == "Matière Première");

            var donnees = await query.ToListAsync();

            var result = donnees
                .GroupBy(f => new
                {
                    Description = f.DimProduit!.Description,
                    Categorie   = f.DimProduit!.Categorie,
                    Groupe      = f.DimProduit!.Groupe
                })
                .Select(g => new AchatParProduitDTO
                {
                    Description     = g.Key.Description,
                    Categorie       = g.Key.Categorie,
                    Groupe          = g.Key.Groupe,
                    MontantTotal    = Math.Round(g.Sum(f => f.QteCommandee * f.PrixUnitaireAchat), 2),
                    QuantiteTotale  = Math.Round(g.Sum(f => f.QteCommandee), 2),
                    NombreCommandes = g.Count()
                })
                .OrderByDescending(x => x.MontantTotal)
                .ToList();

            return result;
        }

        public async Task<AchatsFiltersDTO> GetFiltersAsync()
        {
            var annees = await _context.FaitAchats
                .Include(f => f.DimTemps)
                .Select(f => f.DimTemps!.Annee)
                .Distinct()
                .OrderBy(a => a)
                .ToListAsync();

            var trimestres = await _context.FaitAchats
                .Include(f => f.DimTemps)
                .Select(f => f.DimTemps!.Trimestre)
                .Distinct()
                .OrderBy(t => t)
                .ToListAsync();

            var fournisseurs = await _context.FaitAchats
                .Include(f => f.DimFournisseur)
                .Select(f => f.DimFournisseur!.Nom + " " + f.DimFournisseur!.Prenom)
                .Distinct()
                .OrderBy(n => n)
                .ToListAsync();

            var produits = await _context.FaitAchats
                .Include(f => f.DimProduit)
                .Where(f => f.DimProduit!.TypeProduit == "Matière Première")
                .Select(f => f.DimProduit!.Description)
                .Distinct()
                .OrderBy(p => p)
                .ToListAsync();

            var pays = await _context.FaitAchats
                .Include(f => f.DimFournisseur)
                .Select(f => f.DimFournisseur!.Pays)
                .Distinct()
                .OrderBy(p => p)
                .ToListAsync();

            return new AchatsFiltersDTO
            {
                Annees       = annees,
                Trimestres   = trimestres,
                Fournisseurs = fournisseurs,
                Produits     = produits,
                Pays         = pays
            };
        }

        private IQueryable<FaitAchats> AppliquerFiltres(
            IQueryable<FaitAchats> query,
            int?    annee,
            int?    trimestre,
            string? fournisseur,
            string? produit)
        {
            if (annee.HasValue)
                query = query.Where(f => f.DimTemps!.Annee == annee.Value);

            if (trimestre.HasValue)
                query = query.Where(f => f.DimTemps!.Trimestre == trimestre.Value);

            if (!string.IsNullOrEmpty(fournisseur))
                query = query.Where(f =>
                    (f.DimFournisseur!.Nom + " " + f.DimFournisseur!.Prenom) == fournisseur);

            if (!string.IsNullOrEmpty(produit))
                query = query.Where(f => f.DimProduit!.Description == produit);

            return query;
        }

        // ── Retard Livraison ─────────────────────────────────────────
        public async Task<RetardResponseDTO> GetRetardResponseAsync(
            int?    annee       = null,
            int?    trimestre   = null,
            string? fournisseur = null,
            string? produit     = null)
        {
            var query = _context.FaitAchats
                .Include(f => f.DimTemps)
                .Include(f => f.DimFournisseur)
                .Include(f => f.DimProduit)
                .AsQueryable();

            query = AppliquerFiltres(query, annee, trimestre, fournisseur, produit);
            var donnees = await query.ToListAsync();

            // ── Par Fournisseur ──────────────────────────────────────
            var parFournisseur = donnees
                .GroupBy(f => new {
                    // ✅ CORRIGÉ : Nom + Prenom au lieu de NomComplet
                    NomComplet = f.DimFournisseur!.Nom + " " + f.DimFournisseur!.Prenom,
                    Pays       = f.DimFournisseur!.Pays
                })
                .Select(g => new RetardParFournisseurDTO
                {
                    NomFournisseur   = g.Key.NomComplet,
                    Pays             = g.Key.Pays,
                    NombreRetards    = g.Count(f => f.EstEnRetard),
                    NombreCommandes  = g.Count(),
                    TauxRetard       = g.Count() > 0
                        ? Math.Round((double)g.Count(f => f.EstEnRetard) / g.Count() * 100, 2)
                        : 0,
                    DelaiMoyenRetard = g.Any(f => f.EstEnRetard)
                        ? Math.Round(g.Where(f => f.EstEnRetard)
                                      // ✅ CORRIGÉ : ?? 0 pour gérer le nullable
                                      .Average(f => (double)(f.RetardLivraison ?? 0)), 2)
                        : 0
                })
                .OrderByDescending(x => x.NombreRetards)
                .ToList();

            // ── Par Temps ────────────────────────────────────────────
            var parTemps = donnees
                .GroupBy(f => new {
                    f.DimTemps!.Mois,
                    f.DimTemps!.Trimestre,
                    f.DimTemps!.Annee,
                    f.DimTemps!.LabelMois
                })
                .Select(g => new RetardParTempsDTO
                {
                    Label            = g.Key.LabelMois,
                    Mois             = g.Key.Mois,
                    Trimestre        = g.Key.Trimestre,
                    Annee            = g.Key.Annee,
                    NombreRetards    = g.Count(f => f.EstEnRetard),
                    NombreCommandes  = g.Count(),
                    TauxRetard       = g.Count() > 0
                        ? Math.Round((double)g.Count(f => f.EstEnRetard) / g.Count() * 100, 2)
                        : 0,
                    DelaiMoyenRetard = g.Any(f => f.EstEnRetard)
                        ? Math.Round(g.Where(f => f.EstEnRetard)
                                      // ✅ CORRIGÉ : ?? 0 pour gérer le nullable
                                      .Average(f => (double)(f.RetardLivraison ?? 0)), 2)
                        : 0
                })
                .OrderBy(x => x.Annee)
                .ThenBy(x => x.Mois)
                .ToList();

            // ── Par Produit ──────────────────────────────────────────
            var parProduit = donnees
                .GroupBy(f => new {
                    f.DimProduit!.Description,
                    f.DimProduit!.Categorie
                })
                .Select(g => new RetardParProduitDTO
                {
                    Description      = g.Key.Description,
                    Categorie        = g.Key.Categorie,
                    NombreRetards    = g.Count(f => f.EstEnRetard),
                    NombreCommandes  = g.Count(),
                    TauxRetard       = g.Count() > 0
                        ? Math.Round((double)g.Count(f => f.EstEnRetard) / g.Count() * 100, 2)
                        : 0,
                    DelaiMoyenRetard = g.Any(f => f.EstEnRetard)
                        ? Math.Round(g.Where(f => f.EstEnRetard)
                                      // ✅ CORRIGÉ : ?? 0 pour gérer le nullable
                                      .Average(f => (double)(f.RetardLivraison ?? 0)), 2)
                        : 0
                })
                .OrderByDescending(x => x.NombreRetards)
                .ToList();

            return new RetardResponseDTO
            {
                ParFournisseur = parFournisseur,
                ParTemps       = parTemps,
                ParProduit     = parProduit
            };
        }
    }
}