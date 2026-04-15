// ============================================================
//  IAchatsService.cs — Interface du Service Achats
//  Définit la logique métier pour les KPIs Achats
//
//  Pourquoi un Service en plus du Repository ?
//  → Repository  : accès aux données (SQL, EF Core)
//  → Service     : logique métier (calculs, validations)
//  → Controller  : reçoit la requête HTTP et retourne la réponse
//
//  Flux : Controller → Service → Repository → Base de données
// ============================================================

using WAS_backend.DTOs;

namespace WAS_backend.Services
{
    public interface IAchatsService
    {
        // ============================================================
        // GetKpiGlobalAsync()
        // Retourne tous les KPIs globaux des achats
        // Utilisé pour la KPI Card en haut du dashboard
        // ============================================================
        Task<AchatsKpiGlobalDTO> GetKpiGlobalAsync(
            int?    annee       = null,
            int?    trimestre   = null,
            string? fournisseur = null,
            string? produit     = null
        );

        // ============================================================
        // GetParFournisseurAsync()
        // Retourne le montant total par fournisseur
        // Utilisé pour le Bar Chart horizontal
        // ============================================================
        Task<List<AchatParFournisseurDTO>> GetParFournisseurAsync(
            int?    annee     = null,
            int?    trimestre = null,
            string? produit   = null
        );

        // ============================================================
        // GetParTempsAsync()
        // Retourne le montant total par mois
        // Utilisé pour le Line Chart
        // ============================================================
        Task<List<AchatParTempsDTO>> GetParTempsAsync(
            int?    annee       = null,
            int?    trimestre   = null,
            string? fournisseur = null,
            string? produit     = null
        );

        // ============================================================
        // GetParProduitAsync()
        // Retourne le montant total par produit
        // Utilisé pour le Bar Chart vertical ou Pie Chart
        // ============================================================
        Task<List<AchatParProduitDTO>> GetParProduitAsync(
            int?    annee       = null,
            int?    trimestre   = null,
            string? fournisseur = null
        );

        // ============================================================
        // GetFiltersAsync()
        // Retourne les valeurs disponibles pour les filtres
        // Utilisé pour remplir les listes déroulantes
        // ============================================================
        Task<AchatsFiltersDTO> GetFiltersAsync();

        // ============================================================
        // GetAchatsResponseAsync()
        // Retourne TOUTES les données en un seul appel
        // → évite plusieurs appels HTTP depuis le frontend
        // → le frontend reçoit un seul objet complet
        // ============================================================
        // ── Retard Livraison ─────────────────────────────────────────
Task<RetardResponseDTO> GetRetardResponseAsync(
    int?    annee       = null,
    int?    trimestre   = null,
    string? fournisseur = null,
    string? produit     = null
);
        Task<AchatsResponseDTO> GetAchatsResponseAsync(
            int?    annee       = null,
            int?    trimestre   = null,
            string? fournisseur = null,
            string? produit     = null
        );
    }
}