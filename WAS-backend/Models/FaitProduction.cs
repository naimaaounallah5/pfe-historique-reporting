using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models
{
    [Table("FAIT_Production")]
    public class FaitProduction
    {
        [Key]
        [Column("Id_Production")]
        public int IdProduction { get; set; }

        [Column("Id_Temps")]
        public int IdTemps { get; set; }

        [Column("Id_Produit")]
        public int IdProduit { get; set; }

        [Column("Id_Machine")]
        public int IdMachine { get; set; }

        [Column("Nb_Heure_Machine")]
        public double NbHeureMachine { get; set; }

        [Column("Mt_Matiere_Premiere")]
        public double MtMatierePremiere { get; set; }

        [Column("Cout_Unitaire_Heure")]
        public double CoutUnitaireHeure { get; set; }

        [Column("QuantiteProduite")]
        public double QuantiteProduite { get; set; }  // ← float SQL = double C# ✅

        [Column("Cout_Production")]
        public double? CoutProduction { get; set; }

        [Column("Rentabilite_Machine")]
        public double? RentabiliteMachine { get; set; }

        [Column("Temps_Arret")]
        public int? TempsArret { get; set; }  // ← int SQL = int? C# ✅

        [ForeignKey("IdTemps")]
        public DimTemps? DimTemps { get; set; }

        [ForeignKey("IdProduit")]
        public DimProduit? DimProduit { get; set; }

        [ForeignKey("IdMachine")]
        public DimMachine? DimMachine { get; set; }
    }
}
