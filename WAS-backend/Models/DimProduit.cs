// ============================================================
//  DimProduit.cs — Model de la table DIM_Produit
//  Représente un produit dans WAS_DB
//  Relié à toutes les tables FAIT via IdProduit
//  Permet d'analyser les KPIs par Produit, Catégorie, Groupe
// ============================================================

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models
{
    [Table("DIM_Produit")]
    public class DimProduit
    {
        // ── Clé primaire ────────────────────────────────────
        [Key]
        [Column("Id_Produit")]
        public int IdProduit { get; set; }

        // ── Données métier ──────────────────────────────────
        [Column("Description")]
        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;

        [Column("Categorie")]
        [MaxLength(100)]
        public string Categorie { get; set; } = string.Empty;

        [Column("Groupe")]
        [MaxLength(100)]
        public string Groupe { get; set; } = string.Empty;

        [Column("Unite_Mesure")]
        [MaxLength(50)]
        public string UniteMesure { get; set; } = string.Empty;

        [Column("TypeProduit")]
        [MaxLength(50)]
        public string TypeProduit { get; set; } = string.Empty;

        // ── Navigation properties ───────────────────────────
        // DimProduit est relié à toutes les tables FAIT
        public ICollection<FaitAchats>     FaitAchats     { get; set; } = new List<FaitAchats>();
        public ICollection<FaitVentes>     FaitVentes     { get; set; } = new List<FaitVentes>();
        public ICollection<FaitProduction> FaitProduction { get; set; } = new List<FaitProduction>();
        public ICollection<FaitQualite>    FaitQualite    { get; set; } = new List<FaitQualite>();
        public ICollection<FaitStock>      FaitStock      { get; set; } = new List<FaitStock>();
    }
}