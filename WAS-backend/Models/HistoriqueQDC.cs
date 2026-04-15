using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models
{
    [Table("HistoriqueQDC")]
    public class HistoriqueQDC
    {
        [Key]
        public int Id { get; set; }
        [Required][MaxLength(20)]
        public string NumeroEntree { get; set; } = string.Empty;
        [Required]
        public int Id_Produit { get; set; }
        [Required]
        public int Id_Machine { get; set; }
        [Required]
        public int Id_Temps { get; set; }
        [Required][MaxLength(10)]
        public string LigneProduction { get; set; } = string.Empty;
        [Required][MaxLength(20)]
        public string TypeControle { get; set; } = string.Empty;
        [Required]
        public int QuantiteControlee { get; set; }
        public int QuantiteDefaut    { get; set; } = 0;
        [Column(TypeName = "decimal(5,2)")]
        public decimal TauxDefaut    { get; set; } = 0;
        [Required][MaxLength(20)]
        public string Statut { get; set; } = "En attente";
        public DateTime DateEnregistrement { get; set; } = DateTime.Now;

        [ForeignKey("Id_Produit")] public DimProduit? Produit { get; set; }
        [ForeignKey("Id_Machine")] public DimMachine? Machine { get; set; }
        [ForeignKey("Id_Temps")]   public DimTemps?   Temps   { get; set; }
    }
}