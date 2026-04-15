using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models;

[Table("OperationsGamme")]
public class OperationGamme
{
    [Key]
    public int       Id                       { get; set; }
    public DateTime? Horodatage               { get; set; }
    public int       Statut                   { get; set; } = 0;

    [Column("NumeroOrdreProduction")]
    public string    NumeroOrdreProduction     { get; set; } = string.Empty;

    public int?      NumeroRefGamme           { get; set; }
    public string?   NumeroGamme              { get; set; }
    public string?   NumeroOperation          { get; set; }
    public string?   NumeroOperationSuivante  { get; set; }
    public string?   NumeroOperationPrecedente{ get; set; }
    public string?   NumeroCentreTravail      { get; set; }
    public string?   GroupeCentreTravail      { get; set; }
    public string?   Description              { get; set; }
    public decimal?  TempsReglage             { get; set; }
    public decimal?  TempsExecution           { get; set; }
    public decimal?  TempsAttente             { get; set; }
    public decimal?  TempsDeplacement         { get; set; }
    public decimal?  TailleLot                { get; set; }
    public decimal?  FacteurRebut             { get; set; }
    public DateTime? DateDebut               { get; set; }
    public TimeSpan? HeureDebut              { get; set; }
    public DateTime? DateFin                 { get; set; }
    public TimeSpan? HeureFin               { get; set; }
    public bool?     CheminCritique           { get; set; }
    public int?      StatutGamme              { get; set; }
    public DateTime? DateHeureDebut           { get; set; }
    public DateTime? DateHeureFin             { get; set; }
    public string?   CodeSite                 { get; set; }
    public decimal?  MontantCoutOperationAttendu { get; set; }
    public decimal?  BesoinCapaciteAttendu    { get; set; }
}