using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models
{
    [Table("DIM_Client")]
    public class DimClient
    {
        [Key]
        [Column("Id_Client")]
        public int IdClient { get; set; }

        [Column("Nom")]
        [MaxLength(100)]
        public string Nom { get; set; } = string.Empty;

        [Column("Prenom")]
        [MaxLength(100)]
        public string Prenom { get; set; } = string.Empty;

        [Column("Ville")]
        [MaxLength(100)]
        public string Ville { get; set; } = string.Empty;

        [Column("Pays")]
        [MaxLength(100)]
        public string Pays { get; set; } = string.Empty;

        [NotMapped]
        public string NomComplet => $"{Nom} {Prenom}";

        public ICollection<FaitVentes> FaitVentes { get; set; }
            = new List<FaitVentes>();
    }
}