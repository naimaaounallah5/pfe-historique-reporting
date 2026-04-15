using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models
{
    [Table("DIM_Machine")]
    public class DimMachine
    {
        [Key]
        [Column("Id_Machine")]
        public int IdMachine { get; set; }

        [Column("Nom")]
        [MaxLength(100)]
        public string Nom { get; set; } = string.Empty;

        [Column("Groupe")]
        [MaxLength(100)]
        public string Groupe { get; set; } = string.Empty;

        [Column("Site")]
        [MaxLength(100)]
        public string Site { get; set; } = string.Empty;

        [Column("Capacite_Minutes")]
        public double CapaciteMinutes { get; set; }

        public ICollection<FaitProduction> FaitProduction { get; set; }
            = new List<FaitProduction>();

        public ICollection<FaitQualite> FaitQualite { get; set; }
            = new List<FaitQualite>();
    }
}