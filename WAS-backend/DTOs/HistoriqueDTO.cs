namespace WAS_backend.DTOs
{
    // ── SCADA ────────────────────────────────────────────────
    public class HistoriqueSCADADto
    {
        public int      Id               { get; set; }
        public string   NumeroEntree     { get; set; } = string.Empty;
        public string   NomMachine       { get; set; } = string.Empty;
        public string   NomProduit       { get; set; } = string.Empty;
        public string   NumeroOperation  { get; set; } = string.Empty;
        public string   NumeroOrdre      { get; set; } = string.Empty;
        public int      QuantiteProduite { get; set; }
        public int      QuantiteRebut    { get; set; }
        public int      RunTime          { get; set; }
        public int      StopTime         { get; set; }
        public int      SetupTime        { get; set; }
        public DateTime HeureDebut       { get; set; }
        public DateTime? HeureFin        { get; set; }
        public string   Statut           { get; set; } = string.Empty;
        public DateTime DateEnregistrement { get; set; }
    }

    // ── WMS ──────────────────────────────────────────────────
    public class HistoriqueWMSDto
    {
        public int    Id               { get; set; }
        public string NumeroEntree     { get; set; } = string.Empty;
        public string NomProduit       { get; set; } = string.Empty;
        public string NumeroLot        { get; set; } = string.Empty;
        public string Zone             { get; set; } = string.Empty;
        public string TypeMouvement    { get; set; } = string.Empty;
        public int    QuantiteTraitee  { get; set; }
        public int    QuantiteRejetee  { get; set; }
        public int    DureeTraitement  { get; set; }
        public int    DureeArret       { get; set; }
        public string Statut           { get; set; } = string.Empty;
        public DateTime DateEnregistrement { get; set; }
    }

    // ── QDC ──────────────────────────────────────────────────
    public class HistoriqueQDCDto
    {
        public int     Id                 { get; set; }
        public string  NumeroEntree       { get; set; } = string.Empty;
        public string  NomProduit         { get; set; } = string.Empty;
        public string  NomMachine         { get; set; } = string.Empty;
        public string  LigneProduction    { get; set; } = string.Empty;
        public string  TypeControle       { get; set; } = string.Empty;
        public int     QuantiteControlee  { get; set; }
        public int     QuantiteDefaut     { get; set; }
        public decimal TauxDefaut         { get; set; }
        public string  Statut             { get; set; } = string.Empty;
        public DateTime DateEnregistrement { get; set; }
    }

    // ── AGV ──────────────────────────────────────────────────
    public class HistoriqueAGVDto
    {
        public int    Id                 { get; set; }
        public string NumeroEntree       { get; set; } = string.Empty;
        public string NomProduit         { get; set; } = string.Empty;
        public string CodeAGV            { get; set; } = string.Empty;
        public string NumeroTransfert    { get; set; } = string.Empty;
        public int    QuantiteTransferee { get; set; }
        public int    NombreIncidents    { get; set; }
        public int    RunTime            { get; set; }
        public int    StopTime           { get; set; }
        public string ZoneDepart         { get; set; } = string.Empty;
        public string ZoneArrivee        { get; set; } = string.Empty;
        public string Statut             { get; set; } = string.Empty;
        public DateTime DateEnregistrement { get; set; }
    }

    // ── Paramètres de filtre communs ─────────────────────────
    public class HistoriqueQueryParams
    {
        public string?   Recherche      { get; set; }
        public string?   Statut         { get; set; }
        public DateTime? DateDebut      { get; set; }
        public DateTime? DateFin        { get; set; }
        public string?   CentreTravail  { get; set; } // ← AJOUTÉ
        public int       Page           { get; set; } = 1;
        public int       PageSize       { get; set; } = 10;
    }

    // ── Résultat paginé ──────────────────────────────────────
    public class HistoriquePageResult<T>
    {
        public List<T> Donnees     { get; set; } = new();
        public int     TotalLignes { get; set; }
        public int     Page        { get; set; }
        public int     PageSize    { get; set; }
        public int     TotalPages  => (int)Math.Ceiling((double)TotalLignes / PageSize);
    }
}