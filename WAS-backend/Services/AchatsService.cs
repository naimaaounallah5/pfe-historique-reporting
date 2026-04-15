// ============================================================
//  AchatsService.cs — Implémentation du Service Achats
// ============================================================

using WAS_backend.DTOs;
using WAS_backend.Repositories;

namespace WAS_backend.Services
{
    public class AchatsService : IAchatsService
    {
        private readonly IAchatsRepository _repository;

        public AchatsService(IAchatsRepository repository)
        {
            _repository = repository;
        }

        public async Task<AchatsKpiGlobalDTO> GetKpiGlobalAsync(
            int?    annee       = null,
            int?    trimestre   = null,
            string? fournisseur = null,
            string? produit     = null)
        {
            return await _repository.GetKpiGlobalAsync(annee, trimestre, fournisseur, produit);
        }

        public async Task<List<AchatParFournisseurDTO>> GetParFournisseurAsync(
            int?    annee     = null,
            int?    trimestre = null,
            string? produit   = null)
        {
            return await _repository.GetParFournisseurAsync(annee, trimestre, produit);
        }

        public async Task<List<AchatParTempsDTO>> GetParTempsAsync(
            int?    annee       = null,
            int?    trimestre   = null,
            string? fournisseur = null,
            string? produit     = null)
        {
            return await _repository.GetParTempsAsync(annee, trimestre, fournisseur, produit);
        }

        public async Task<List<AchatParProduitDTO>> GetParProduitAsync(
            int?    annee       = null,
            int?    trimestre   = null,
            string? fournisseur = null)
        {
            return await _repository.GetParProduitAsync(annee, trimestre, fournisseur);
        }

        public async Task<AchatsFiltersDTO> GetFiltersAsync()
        {
            return await _repository.GetFiltersAsync();
        }

        // ============================================================
        // GetAchatsResponseAsync()
        // Appels SÉQUENTIELS — DbContext n'est pas thread-safe
        // ============================================================
        public async Task<AchatsResponseDTO> GetAchatsResponseAsync(
            int?    annee       = null,
            int?    trimestre   = null,
            string? fournisseur = null,
            string? produit     = null)
        {
            // Séquentiel obligatoire — même instance DbContext
            var global        = await _repository.GetKpiGlobalAsync(annee, trimestre, fournisseur, produit);
            var parFournisseur = await _repository.GetParFournisseurAsync(annee, trimestre, produit);
            var parTemps      = await _repository.GetParTempsAsync(annee, trimestre, fournisseur, produit);
            var parProduit    = await _repository.GetParProduitAsync(annee, trimestre, fournisseur);
            var filters       = await _repository.GetFiltersAsync();

            return new AchatsResponseDTO
            {
                Global         = global,
                ParFournisseur = parFournisseur,
                ParTemps       = parTemps,
                ParProduit     = parProduit,
                Filters        = filters
            };
        }
        // ── Retard Livraison ─────────────────────────────────────────
public async Task<RetardResponseDTO> GetRetardResponseAsync(
    int?    annee       = null,
    int?    trimestre   = null,
    string? fournisseur = null,
    string? produit     = null)
{
    return await _repository.GetRetardResponseAsync(
        annee, trimestre, fournisseur, produit);
}
    }
    
}