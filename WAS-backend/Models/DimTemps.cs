// ============================================================
//  DimTemps.cs — Model de la table DIM_Temps
//  Représente une période temporelle dans WAS_DB
//  Relié à toutes les tables FAIT via IdTemps
//  Permet d'analyser les KPIs par Mois, Trimestre, Année
// ============================================================

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models
{
    [Table("DIM_Temps")]
    public class DimTemps
    {
        // ── Clé primaire ────────────────────────────────────
        [Key]
        [Column("Id_Temps")]
        public int IdTemps { get; set; }

        // ── Données métier ──────────────────────────────────
        [Column("Mois")]
        public int Mois { get; set; }

        [Column("Trimestre")]
        public int Trimestre { get; set; }

        [Column("Annee")]
        public int Annee { get; set; }

        // ── Propriétés calculées ────────────────────────────
        // Utilisées dans les graphiques pour afficher
        // des labels lisibles sur l'axe X

        [NotMapped]
        // Label du mois : "Jan 2024", "Fev 2024"...
        public string LabelMois => $"{NomMois(Mois)} {Annee}";

        [NotMapped]
        // Label du trimestre : "T1 2024", "T2 2024"...
        public string LabelTrimestre => $"T{Trimestre} {Annee}";

        // ── Méthode utilitaire ──────────────────────────────
        // Convertit le numéro du mois en nom abrégé
        private static string NomMois(int mois) => mois switch
        {
            1  => "Jan",
            2  => "Fev",
            3  => "Mar",
            4  => "Avr",
            5  => "Mai",
            6  => "Jun",
            7  => "Jul",
            8  => "Aou",
            9  => "Sep",
            10 => "Oct",
            11 => "Nov",
            12 => "Dec",
            _  => "???"
        };

        // ── Navigation properties ───────────────────────────
        // DimTemps est relié à toutes les tables FAIT
        public ICollection<FaitAchats>     FaitAchats     { get; set; } = new List<FaitAchats>();
        public ICollection<FaitVentes>     FaitVentes     { get; set; } = new List<FaitVentes>();
        public ICollection<FaitProduction> FaitProduction { get; set; } = new List<FaitProduction>();
        public ICollection<FaitQualite>    FaitQualite    { get; set; } = new List<FaitQualite>();
        public ICollection<FaitStock>      FaitStock      { get; set; } = new List<FaitStock>();
    }
}