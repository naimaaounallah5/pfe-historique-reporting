using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models
{
    [Table("HistoriqueWMS")]
    public class HistoriqueWMS
    {
        [Key]
        public int Id { get; set; }
        [Required][MaxLength(20)]
        public string NumeroEntree { get; set; } = string.Empty;
        [Required]
        public int Id_Produit { get; set; }
        [Required]
        public int Id_Temps { get; set; }
        [Required][MaxLength(20)]
        public string NumeroLot { get; set; } = string.Empty;
        [Required][MaxLength(10)]
        public string Zone { get; set; } = string.Empty;
        [Required][MaxLength(20)]
        public string TypeMouvement { get; set; } = string.Empty;
        [Required]
        public int QuantiteTraitee  { get; set; }
        public int QuantiteRejetee  { get; set; } = 0;
        public int DureeTraitement  { get; set; } = 0;
        public int DureeArret       { get; set; } = 0;
        [Required][MaxLength(20)]
        public string Statut { get; set; } = "En cours";
        public DateTime DateEnregistrement { get; set; } = DateTime.Now;

        [ForeignKey("Id_Produit")] public DimProduit? Produit { get; set; }
        [ForeignKey("Id_Temps")]   public DimTemps?   Temps   { get; set; }
    }
}