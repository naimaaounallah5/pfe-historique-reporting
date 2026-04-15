using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models;

[Table("LignesOrdreProduction")]
public class LigneOrdreProduction
{
    [Key]
    public int       Id                       { get; set; }
    public DateTime? Horodatage               { get; set; }
    public int       Statut                   { get; set; } = 0;

    [Column("NumeroOrdreProduction")]
    public string    NumeroOrdreProduction     { get; set; } = string.Empty;

    public int?      NumeroLigne              { get; set; }
    public string?   ReferenceArticle         { get; set; }
    public string?   CodeVariante             { get; set; }
    public string?   Description              { get; set; }
    public string?   Description2             { get; set; }
    public string?   CodeSite                 { get; set; }
    public string?   CodeDimension1           { get; set; }
    public string?   CodeDimension2           { get; set; }
    public string?   CodeEmplacement          { get; set; }
    public decimal?  Quantite                 { get; set; }
    public decimal?  QuantiteTerminee         { get; set; }
    public decimal?  QuantiteRestante         { get; set; }
    public decimal?  TauxRebut               { get; set; }
    public DateTime? DatePrevue               { get; set; }
    public DateTime? DateDebut               { get; set; }
    public TimeSpan? HeureDebut              { get; set; }
    public DateTime? DateFin                 { get; set; }
    public TimeSpan? HeureFin               { get; set; }
    public int?      CodeNiveauPlanification  { get; set; }
    public int?      Priorite                { get; set; }
    public string?   NumeroBOM               { get; set; }
    public string?   NumeroGamme             { get; set; }
    public string?   GroupeStockInventaire   { get; set; }
    public int?      NumeroRefGamme          { get; set; }
    public decimal?  CoutUnitaire            { get; set; }
    public decimal?  MontantCout             { get; set; }
    public string?   UniteMesure             { get; set; }
    public decimal?  QuantiteBase            { get; set; }
    public decimal?  QuantiteTermineeBase    { get; set; }
    public decimal?  QuantiteRestanteBase    { get; set; }
    public DateTime? DateHeureDebut          { get; set; }
    public DateTime? DateHeureFin            { get; set; }
    public string?   VersionBOM              { get; set; }
    public string?   VersionGamme            { get; set; }
    public decimal?  CoutIndirect            { get; set; }
    public decimal?  TauxGeneraux            { get; set; }
}