using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models
{
    [Table("FAIT_Stock")]
    public class FaitStock
    {
        [Key]
        [Column("Id_Stock")]
        public int IdStock { get; set; }

        [Column("Id_Temps")]
        public int IdTemps { get; set; }

        [Column("Id_Produit")]
        public int IdProduit { get; set; }

        [Column("StockEntree")]
        public double StockEntree { get; set; }

        [Column("StockSortie")]
        public double StockSortie { get; set; }

        [Column("Stock_Disponible")]
        public double? StockDisponible { get; set; }

        [NotMapped]
        public double StockDisponibleCalcule => StockEntree - StockSortie;

        [ForeignKey("IdTemps")]
        public DimTemps? DimTemps { get; set; }

        [ForeignKey("IdProduit")]
        public DimProduit? DimProduit { get; set; }
    }
}