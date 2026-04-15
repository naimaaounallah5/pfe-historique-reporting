// ============================================================
//  DimFournisseur.cs — Model de la table DIM_Fournisseur
//  Représente un fournisseur dans WAS_DB
//  Utilisé pour grouper les achats par fournisseur
// ============================================================

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models
{
    [Table("DIM_Fournisseur")]
    public class DimFournisseur
    {
        // ── Clé primaire ────────────────────────────────────
        [Key]
        [Column("Id_Fournisseur")]
        public int IdFournisseur { get; set; }

        // ── Données métier ──────────────────────────────────
        [Column("Nom")]
        [Required]
        public string Nom { get; set; } = string.Empty;

        [Column("Prenom")]
        [Required]
        public string Prenom { get; set; } = string.Empty;

        [Column("Ville")]
        [Required]
        public string Ville { get; set; } = string.Empty;

        [Column("Pays")]
        [Required]
        public string Pays { get; set; } = string.Empty;

        // ── Propriété calculée (pas en DB) ──────────────────
        [NotMapped]
        // NomComplet = Nom + Prénom pour affichage dans les graphiques
        public string NomComplet => $"{Nom} {Prenom}";

        // ── Navigation property ─────────────────────────────
        // Un fournisseur peut avoir plusieurs achats
        public ICollection<FaitAchats>? FaitAchats { get; set; }
    }
}