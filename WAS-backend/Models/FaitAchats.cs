// ============================================================
//  FaitAchats.cs — Model de la table FAIT_Achats
//  Représente une ligne de la table FAIT_Achats dans WAS_DB
//  Les KPIs sont calculés ici via des propriétés calculées :
//  → MontantTotal     = QteCommandee * PrixUnitaireAchat
//  → RetardLivraison  = DelaiLivraisonReel - DelaiLivraisonConvenu
// ============================================================

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models
{
    [Table("FAIT_Achats")]
    public class FaitAchats
    {
        // ── Clé primaire ────────────────────────────────────
        [Key]
        [Column("Id_Achat")]
        public int IdAchat { get; set; }

        // ── Clés étrangères ─────────────────────────────────
        [Column("Id_Temps")]
        public int IdTemps { get; set; }

        [Column("Id_Produit")]
        public int IdProduit { get; set; }

        [Column("Id_Fournisseur")]
        public int IdFournisseur { get; set; }

        // ── Données métier ──────────────────────────────────
        [Column("QteCommandee")]
        public double QteCommandee { get; set; }

        [Column("PrixUnitaireAchat")]
        public double PrixUnitaireAchat { get; set; }

        [Column("Delai_Livraison_Convenu")]
        public int DelaiLivraisonConvenu { get; set; }

        [Column("DelaiLivraisonReel")]
        public int DelaiLivraisonReel { get; set; }

        // ── KPIs stockés en DB ───────────────────────────────
        // Ces colonnes existent dans FAIT_Achats
        // Le backend les calcule et les sauvegarde

        [Column("Montant_Total_Achats")]
        public double? MontantTotalAchats { get; set; }

        [Column("Retard_Livraison")]
        public int? RetardLivraison { get; set; }

        // ── KPIs calculés (pas stockés en DB) ───────────────
        // [NotMapped] → EF Core ignore ces propriétés
        // elles sont calculées à la volée dans le code C#

        [NotMapped]
        // MontantTotal = quantité commandée × prix unitaire
        public double MontantTotal => QteCommandee * PrixUnitaireAchat;

        [NotMapped]
        // EstEnRetard = true si livraison en retard
        public bool EstEnRetard => DelaiLivraisonReel > DelaiLivraisonConvenu;

        // ── Navigation properties ───────────────────────────
        // Permettent d'accéder aux données des tables DIM
        // via Entity Framework Core (jointures automatiques)

        [ForeignKey("IdTemps")]
        public DimTemps? DimTemps { get; set; }

        [ForeignKey("IdProduit")]
        public DimProduit? DimProduit { get; set; }

        [ForeignKey("IdFournisseur")]
        public DimFournisseur? DimFournisseur { get; set; }
    }
}