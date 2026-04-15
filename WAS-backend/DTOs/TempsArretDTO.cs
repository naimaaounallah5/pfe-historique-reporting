namespace WAS_backend.DTOs
{
    public class TempsArretQueryParams
    {
        public int? MachineId { get; set; }
        public int? ProduitId { get; set; }
        public int? Annee { get; set; }
        public int? Trimestre { get; set; }
    }

    public class TempsArretGlobalDTO
    {
        public double TotalArretMinutes { get; set; }
        public double TotalArretHeures { get; set; }
        public int NbOrdres { get; set; }
        public double MoyenneArretParOrdre { get; set; }
    }

    public class TempsArretParMachineDTO
    {
        public int MachineId { get; set; }
        public string MachineNom { get; set; } = string.Empty;
        public string MachineGroupe { get; set; } = string.Empty;
        public double TotalArretMinutes { get; set; }
        public double TotalArretHeures { get; set; }
        public int NbOrdres { get; set; }
        public double Pourcentage { get; set; }
    }

    public class TempsArretParTempsDTO
    {
        public string Periode { get; set; } = string.Empty;
        public int Annee { get; set; }
        public int Mois { get; set; }
        public int Trimestre { get; set; }
        public double TotalArretMinutes { get; set; }
        public int NbOrdres { get; set; }
    }

    public class TempsArretParProduitDTO
    {
        public int ProduitId { get; set; }
        public string ProduitNom { get; set; } = string.Empty;
        public double TotalArretMinutes { get; set; }
        public int NbOrdres { get; set; }
        public double MoyenneArretParOrdre { get; set; }
    }

    public class TempsArretResponseDTO
    {
        public TempsArretGlobalDTO Global { get; set; } = new();
        public List<TempsArretParMachineDTO> ParMachine { get; set; } = new();
        public List<TempsArretParTempsDTO> ParTemps { get; set; } = new();
        public List<TempsArretParProduitDTO> ParProduit { get; set; } = new();
        public List<int> Annees { get; set; } = new();
    }
}