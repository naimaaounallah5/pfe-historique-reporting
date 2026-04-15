using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models
{
    [Table("HistoriqueAGV")]
    public class HistoriqueAGV
    {
        [Key]
        public int Id { get; set; }
        [Required][MaxLength(20)]
        public string NumeroEntree { get; set; } = string.Empty;
        [Required]
        public int Id_Produit { get; set; }
        [Required]
        public int Id_Temps { get; set; }
        [Required][MaxLength(10)]
        public string CodeAGV { get; set; } = string.Empty;
        [Required][MaxLength(20)]
        public string NumeroTransfert { get; set; } = string.Empty;
        [Required]
        public int QuantiteTransferee { get; set; }
        public int NombreIncidents    { get; set; } = 0;
        public int RunTime            { get; set; } = 0;
        public int StopTime           { get; set; } = 0;
        [Required][MaxLength(10)]
        public string ZoneDepart  { get; set; } = string.Empty;
        [Required][MaxLength(10)]
        public string ZoneArrivee { get; set; } = string.Empty;
        [Required][MaxLength(20)]
        public string Statut { get; set; } = "Actif";
        public DateTime DateEnregistrement { get; set; } = DateTime.Now;

        [ForeignKey("Id_Produit")] public DimProduit? Produit { get; set; }
        [ForeignKey("Id_Temps")]   public DimTemps?   Temps   { get; set; }
    }
}