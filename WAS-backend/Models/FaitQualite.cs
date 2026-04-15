using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models
{
    [Table("FAIT_Qualite")]
    public class FaitQualite
    {
        [Key]
        [Column("Id_Qualite")]
        public int IdQualite { get; set; }

        [Column("Id_Temps")]
        public int IdTemps { get; set; }

        [Column("Id_Produit")]
        public int IdProduit { get; set; }

        [Column("Id_Machine")]
        public int IdMachine { get; set; }

        [Column("QteDefectueuse")]
        public double QteDefectueuse { get; set; }

        [Column("QteProduiteTotal")]
        public double QteProduiteTotal { get; set; }

        [Column("Taux_Defauts")]
        public double? TauxDefauts { get; set; }

        [NotMapped]
        public double TauxDefautsCalcule =>
            QteProduiteTotal > 0 ? (QteDefectueuse / QteProduiteTotal) * 100 : 0;

        [ForeignKey("IdTemps")]
        public DimTemps? DimTemps { get; set; }

        [ForeignKey("IdProduit")]
        public DimProduit? DimProduit { get; set; }

        [ForeignKey("IdMachine")]
        public DimMachine? DimMachine { get; set; }
    }
}