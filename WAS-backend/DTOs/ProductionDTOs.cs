namespace WAS_backend.DTOs
{
    public class ProductionKpiDTO
    {
        public double CoutTotalProduction { get; set; }
        public double CoutTotalMatiere    { get; set; }
        public double CoutTotalMachine    { get; set; }
        public int    NombreOrdres        { get; set; }
        public double CoutMoyenParOrdre   { get; set; }
    }

    public class CoutParTempsDTO
    {
        public string Label        { get; set; } = "";
        public int    Mois         { get; set; }
        public int    Trimestre    { get; set; }
        public int    Annee        { get; set; }
        public double CoutTotal    { get; set; }
        public double CoutMatiere  { get; set; }
        public double CoutMachine  { get; set; }
        public int    NombreOrdres { get; set; }
    }

    public class CoutParProduitDTO
    {
        public string Produit          { get; set; } = "";
        public string Categorie        { get; set; } = "";
        public double CoutTotal        { get; set; }
        public double CoutMatiere      { get; set; }
        public double CoutMachine      { get; set; }
        public int    NombreOrdres     { get; set; }
        public double QuantiteProduite { get; set; }
    }

    public class CoutParMachineDTO
    {
        public string Machine       { get; set; } = "";
        public string Groupe        { get; set; } = "";
        public string Site          { get; set; } = "";
        public double CoutTotal     { get; set; }
        public double CoutMachine   { get; set; }
        public double HeuresMachine { get; set; }
        public int    NombreOrdres  { get; set; }
    }

    public class ProductionResponseDTO
    {
        public ProductionKpiDTO        Kpi        { get; set; } = new();
        public List<CoutParTempsDTO>   ParTemps   { get; set; } = new();
        public List<CoutParProduitDTO> ParProduit { get; set; } = new();
        public List<CoutParMachineDTO> ParMachine { get; set; } = new();
    }
}