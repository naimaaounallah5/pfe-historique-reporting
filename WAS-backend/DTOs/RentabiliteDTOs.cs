namespace WAS_backend.DTOs
{
    // ── KPI Global ───────────────────────────────────────────
    public class RentabiliteKpiDTO
    {
        public double RentabiliteMoyenne      { get; set; }  // % moyen toutes machines
        public int    NbMachinesRentables     { get; set; }  // > 100%
        public int    NbMachinesNonRentables  { get; set; }  // < 100%
        public int    NombreOrdres            { get; set; }
        public double RevenuTotal             { get; set; }
        public double CoutMachineTotal        { get; set; }
    }

    // ── Rentabilité par Temps ────────────────────────────────
    public class RentabiliteParTempsDTO
    {
        public string Label               { get; set; } = "";
        public int    Mois                { get; set; }
        public int    Trimestre           { get; set; }
        public int    Annee               { get; set; }
        public double RentabiliteMoyenne  { get; set; }
        public double RevenuTotal         { get; set; }
        public double CoutMachineTotal    { get; set; }
        public int    NombreOrdres        { get; set; }
    }

    // ── Rentabilité par Produit ──────────────────────────────
    public class RentabiliteParProduitDTO
    {
        public string Produit             { get; set; } = "";
        public string Categorie           { get; set; } = "";
        public double RentabiliteMoyenne  { get; set; }
        public double RevenuTotal         { get; set; }
        public double CoutMachineTotal    { get; set; }
        public int    NombreOrdres        { get; set; }
        public bool   EstRentable         { get; set; }  // true si > 100%
    }

    // ── Rentabilité par Machine ──────────────────────────────
    public class RentabiliteParMachineDTO
    {
        public string Machine             { get; set; } = "";
        public string Groupe              { get; set; } = "";
        public string Site                { get; set; } = "";
        public double RentabiliteMoyenne  { get; set; }
        public double RevenuTotal         { get; set; }
        public double CoutMachineTotal    { get; set; }
        public double HeuresMachine       { get; set; }
        public int    NombreOrdres        { get; set; }
        public bool   EstRentable         { get; set; }  // true si > 100%
    }

    // ── Réponse complète ─────────────────────────────────────
    public class RentabiliteResponseDTO
    {
        public RentabiliteKpiDTO               Kpi        { get; set; } = new();
        public List<RentabiliteParTempsDTO>    ParTemps   { get; set; } = new();
        public List<RentabiliteParProduitDTO>  ParProduit { get; set; } = new();
        public List<RentabiliteParMachineDTO>  ParMachine { get; set; } = new();
    }
}