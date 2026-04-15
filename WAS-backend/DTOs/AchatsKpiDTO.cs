// ============================================================
//  AchatsKpiDTO.cs — Data Transfer Object pour les KPIs Achats
//  Ce fichier contient TOUS les DTOs nécessaires pour
//  transférer les données des achats vers le frontend
//
//  DTOs créés :
//  → AchatsKpiGlobalDTO      : KPI global (montant total)
//  → AchatParFournisseurDTO  : montant par fournisseur
//  → AchatParTempsDTO        : montant par mois
//  → AchatParProduitDTO      : montant par produit
//  → AchatsFiltersDTO        : filtres disponibles
// ============================================================

namespace WAS_backend.DTOs
{
    // ============================================================
    // AchatsKpiGlobalDTO
    // Utilisé pour afficher le KPI Card en haut du dashboard
    // Exemple : "Montant Total Achats : 125 000 €"
    // ============================================================
    public class AchatsKpiGlobalDTO
    {
        // Montant total de tous les achats
        // = SUM(QteCommandee * PrixUnitaireAchat)
        public double MontantTotalAchats { get; set; }

        // Nombre total de commandes
        public int NombreCommandes { get; set; }

        // Nombre de commandes en retard
        public int NombreRetards { get; set; }

        // Taux de retard = NombreRetards / NombreCommandes * 100
        public double TauxRetard { get; set; }

        // Délai moyen de livraison réel
        public double DelaiMoyenReel { get; set; }

        // Délai moyen de livraison convenu
        public double DelaiMoyenConvenu { get; set; }
    }

    // ============================================================
    // AchatParFournisseurDTO
    // Utilisé pour le Bar Chart horizontal
    // Axe Y : nom du fournisseur
    // Axe X : montant total des achats
    // ============================================================
    public class AchatParFournisseurDTO
    {
        // Nom complet du fournisseur (Nom + Prenom)
        public string NomFournisseur { get; set; } = string.Empty;

        // Pays du fournisseur (pour filtrage)
        public string Pays { get; set; } = string.Empty;

        // Montant total des achats chez ce fournisseur
        // = SUM(QteCommandee * PrixUnitaireAchat)
        // GROUP BY Nom_Fournisseur
        public double MontantTotal { get; set; }

        // Nombre de commandes chez ce fournisseur
        public int NombreCommandes { get; set; }

        // Nombre de retards chez ce fournisseur
        public int NombreRetards { get; set; }
    }

    // ============================================================
    // AchatParTempsDTO
    // Utilisé pour le Line Chart
    // Axe X : mois/trimestre
    // Axe Y : montant total des achats
    // ============================================================
    public class AchatParTempsDTO
    {
        // Label affiché sur l'axe X du graphique
        // Exemple : "Jan 2024", "T1 2024"
        public string Label { get; set; } = string.Empty;

        // Mois (1-12) pour tri et filtre
        public int Mois { get; set; }

        // Trimestre (1-4) pour regroupement
        public int Trimestre { get; set; }

        // Année pour filtre
        public int Annee { get; set; }

        // Montant total des achats pour cette période
        // = SUM(QteCommandee * PrixUnitaireAchat)
        // GROUP BY Mois, Annee
        public double MontantTotal { get; set; }

        // Nombre de commandes pour cette période
        public int NombreCommandes { get; set; }
    }

    // ============================================================
    // AchatParProduitDTO
    // Utilisé pour le Bar Chart vertical ou Pie Chart
    // Montre quels produits sont les plus achetés
    // ============================================================
    public class AchatParProduitDTO
    {
        // Description du produit
        public string Description { get; set; } = string.Empty;

        // Catégorie du produit (pour filtrage)
        public string Categorie { get; set; } = string.Empty;

        // Groupe du produit (pour filtrage)
        public string Groupe { get; set; } = string.Empty;

        // Montant total des achats pour ce produit
        // = SUM(QteCommandee * PrixUnitaireAchat)
        // GROUP BY Description
        public double MontantTotal { get; set; }

        // Quantité totale commandée pour ce produit
        public double QuantiteTotale { get; set; }

        // Nombre de commandes pour ce produit
        public int NombreCommandes { get; set; }
    }

    // ============================================================
    // AchatsFiltersDTO
    // Contient les valeurs disponibles pour les filtres
    // du dashboard (listes déroulantes)
    // ============================================================
    public class AchatsFiltersDTO
    {
        // Liste des années disponibles → [2024, 2025, 2026]
        public List<int> Annees { get; set; } = new();

        // Liste des trimestres → [1, 2, 3, 4]
        public List<int> Trimestres { get; set; } = new();

        // Liste des fournisseurs disponibles
        public List<string> Fournisseurs { get; set; } = new();

        // Liste des produits disponibles
        public List<string> Produits { get; set; } = new();

        // Liste des pays fournisseurs disponibles
        public List<string> Pays { get; set; } = new();
    }

    // ============================================================
    // AchatsResponseDTO
    // DTO principal retourné par le Controller
    // Contient TOUTES les données nécessaires pour le dashboard
    // Le frontend reçoit ce seul objet et l'utilise pour
    // afficher tous les graphiques et KPIs
    // ============================================================
    public class AchatsResponseDTO
    {
        // KPI global (carte en haut)
        public AchatsKpiGlobalDTO Global { get; set; } = new();

        // Données par fournisseur (Bar Chart horizontal)
        public List<AchatParFournisseurDTO> ParFournisseur { get; set; } = new();

        // Données par temps (Line Chart)
        public List<AchatParTempsDTO> ParTemps { get; set; } = new();

        // Données par produit (Bar Chart / Pie Chart)
        public List<AchatParProduitDTO> ParProduit { get; set; } = new();

        // Filtres disponibles (listes déroulantes)
        public AchatsFiltersDTO Filters { get; set; } = new();
    }
}