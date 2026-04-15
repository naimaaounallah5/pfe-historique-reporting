using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models;

public class OrdreProduction
{
    public int       Id                    { get; set; }
    public DateTime? Horodatage            { get; set; }
    public int       Statut                { get; set; } = 0;

    // ✅ CORRIGÉ — non nullable
    public string    Numero                { get; set; } = string.Empty;

    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    public string?   NumeroAuto            { get; set; }
    public string?   Description           { get; set; }
    public string?   DescriptionRecherche  { get; set; }
    public string?   Description2          { get; set; }
    public DateTime? DateCreation          { get; set; }
    public DateTime? DateDerniereModif     { get; set; }
    public int?      TypeSource            { get; set; }
    public string?   NumeroSource          { get; set; }
    public string?   NumeroGamme           { get; set; }
    public string?   CodeVariante          { get; set; }
    public string?   GroupeStockInventaire { get; set; }
    public string?   GroupeComptaProd      { get; set; }
    public string?   GroupeComptaAffaires  { get; set; }
    public TimeSpan? HeureDebut            { get; set; }
    public DateTime? DateDebut             { get; set; }
    public TimeSpan? HeureFin              { get; set; }
    public DateTime? DateFin               { get; set; }
    public DateTime? DatePrevue            { get; set; }
    public DateTime? DateFinReelle         { get; set; }
    public bool      Bloque                { get; set; } = false;
    public string?   CodeDimension1        { get; set; }
    public string?   CodeDimension2        { get; set; }
    public string?   CodeSite              { get; set; }
    public string?   CodeEmplacement       { get; set; }
    public string?   NumeroReplanRef       { get; set; }
    public int?      StatutReplanRef       { get; set; }
    public int?      CodeNiveauBas         { get; set; }
    public decimal?  Quantite              { get; set; }
    public decimal?  CoutUnitaire          { get; set; }
    public decimal?  MontantCout           { get; set; }
    public string?   SerieNumero           { get; set; }
    public string?   NumeroOrdrePrevu      { get; set; }
    public string?   NumeroOrdreFerme      { get; set; }
    public string?   NumeroOrdreSimule     { get; set; }
    public DateTime? DateHeureDebut        { get; set; }
    public DateTime? DateHeureFin          { get; set; }
    public int?      IdEnsembleDimension   { get; set; }
    public string?   OperateurAssigne      { get; set; }

    // Navigation
    public ICollection<LigneOrdreProduction> Lignes     { get; set; } = new List<LigneOrdreProduction>();
    public ICollection<ComposantOrdre>       Composants { get; set; } = new List<ComposantOrdre>();
    public ICollection<OperationGamme>       Operations { get; set; } = new List<OperationGamme>();
}