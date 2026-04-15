using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models
{
    [Table("FAIT_Ventes")]
    public class FaitVentes
    {
        [Key]
        [Column("Id_Vente")]
        public int IdVente { get; set; }

        [Column("Id_Temps")]
        public int IdTemps { get; set; }

        [Column("Id_Produit")]
        public int IdProduit { get; set; }

        [Column("Id_Client")]
        public int IdClient { get; set; }

        [Column("QteVendue")]
        public double QteVendue { get; set; }

        [Column("PrixVenteUnitaire")]
        public double PrixVenteUnitaire { get; set; }

        [Column("MontantVenteHT")]
        public double MontantVenteHT { get; set; }

        [Column("Chiffre_Affaires")]
        public double? ChiffreAffaires { get; set; }

        [NotMapped]
        public double ChiffreAffairesCalcule => QteVendue * PrixVenteUnitaire;

        [ForeignKey("IdTemps")]
        public DimTemps? DimTemps { get; set; }

        [ForeignKey("IdProduit")]
        public DimProduit? DimProduit { get; set; }

        [ForeignKey("IdClient")]
        public DimClient? DimClient { get; set; }
    }
}