using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models
{
    [Table("HistoriqueSCADA")]
    public class HistoriqueSCADA
    {
        [Key]
        public int Id { get; set; }
        [Required][MaxLength(20)]
        public string NumeroEntree { get; set; } = string.Empty;
        [Required]
        public int Id_Machine { get; set; }
        [Required]
        public int Id_Produit { get; set; }
        [Required]
        public int Id_Temps { get; set; }
        [Required][MaxLength(20)]
        public string NumeroOperation { get; set; } = string.Empty;
        [Required][MaxLength(20)]
        public string NumeroOrdre { get; set; } = string.Empty;
        [Required]
        public int QuantiteProduite { get; set; }
        public int QuantiteRebut   { get; set; } = 0;
        public int RunTime         { get; set; } = 0;
        public int StopTime        { get; set; } = 0;
        public int SetupTime       { get; set; } = 0;
        [Required]
        public DateTime HeureDebut { get; set; }
        public DateTime? HeureFin  { get; set; }
        [Required][MaxLength(20)]
        public string Statut { get; set; } = "Actif";
        public DateTime DateEnregistrement { get; set; } = DateTime.Now;

        [ForeignKey("Id_Machine")] public DimMachine? Machine { get; set; }
        [ForeignKey("Id_Produit")] public DimProduit? Produit { get; set; }
        [ForeignKey("Id_Temps")]   public DimTemps?   Temps   { get; set; }
    }
}