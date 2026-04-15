// ============================================================
//  IAchatsRepository.cs — Interface du Repository Achats
//  Définit TOUTES les méthodes d'accès aux données
//  pour les KPIs Achats
//
//  Pourquoi une interface ?
//  → Séparation entre la définition (interface) et
//    l'implémentation (AchatsRepository.cs)
//  → Facilite les tests unitaires (mock)
//  → Respecte le principe SOLID (Dependency Inversion)
// ============================================================

using WAS_backend.DTOs;

namespace WAS_backend.Repositories
{
    public interface IAchatsRepository
    {
        // ============================================================
        // GetKpiGlobalAsync()
        // Retourne le KPI global des achats :
        //   → Montant total = SUM(QteCommandee * PrixUnitaireAchat)
        //   → Nombre de commandes
        //   → Nombre de retards
        //   → Taux de retard
        //   → Délai moyen réel et convenu
        //
        // Paramètres optionnels pour filtrage :
        //   → annee      : filtrer par année (ex: 2024)
        //   → trimestre  : filtrer par trimestre (ex: 1)
        //   → fournisseur: filtrer par nom fournisseur
        //   → produit    : filtrer par description produit
        // ============================================================
        Task<AchatsKpiGlobalDTO> GetKpiGlobalAsync(
            int?    annee       = null,
            int?    trimestre   = null,
            string? fournisseur = null,
            string? produit     = null
        );

        // ============================================================
        // GetParFournisseurAsync()
        // Retourne le montant total des achats par fournisseur
        // Utilisé pour le Bar Chart horizontal
        //
        // Résultat trié par MontantTotal décroissant
        // → les plus gros fournisseurs en premier
        // ============================================================
        Task<List<AchatParFournisseurDTO>> GetParFournisseurAsync(
            int?    annee     = null,
            int?    trimestre = null,
            string? produit   = null
        );

        // ============================================================
        // GetParTempsAsync()
        // Retourne le montant total des achats par mois
        // Utilisé pour le Line Chart
        //
        // Résultat trié par Annee puis Mois croissant
        // → ordre chronologique pour le graphique
        // ============================================================
        Task<List<AchatParTempsDTO>> GetParTempsAsync(
            int?    annee       = null,
            int?    trimestre   = null,
            string? fournisseur = null,
            string? produit     = null
        );

        // ============================================================
        // GetParProduitAsync()
        // Retourne le montant total des achats par produit
        // Utilisé pour le Bar Chart vertical ou Pie Chart
        //
        // Résultat trié par MontantTotal décroissant
        // → les produits les plus achetés en premier
        // ============================================================
        Task<List<AchatParProduitDTO>> GetParProduitAsync(
            int?    annee       = null,
            int?    trimestre   = null,
            string? fournisseur = null
        );

        // ============================================================
        // GetFiltersAsync()
        // Retourne toutes les valeurs disponibles pour les filtres
        // Utilisé pour remplir les listes déroulantes du dashboard
        // ============================================================
        Task<AchatsFiltersDTO> GetFiltersAsync();
        // ── Retard Livraison ─────────────────────────────────────────
Task<RetardResponseDTO> GetRetardResponseAsync(
    int?    annee       = null,
    int?    trimestre   = null,
    string? fournisseur = null,
    string? produit     = null
);
    }
}