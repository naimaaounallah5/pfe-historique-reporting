using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models;

[Table("ComposantsOrdre")]
public class ComposantOrdre
{
    [Key]
    public int       Id                       { get; set; }
    public DateTime? Horodatage               { get; set; }
    public int       Statut                   { get; set; } = 0;

    [Column("NumeroOrdreProduction")]
    public string    NumeroOrdreProduction     { get; set; } = string.Empty;

    public int?      NumeroLigneOrdre         { get; set; }
    public int?      NumeroLigne              { get; set; }
    public string?   ReferenceArticle         { get; set; }
    public string?   Description              { get; set; }
    public string?   UniteMesure              { get; set; }
    public decimal?  Quantite                 { get; set; }
    public decimal?  QuantiteAttendue         { get; set; }
    public decimal?  QuantiteRestante         { get; set; }
    public decimal?  TauxRebut               { get; set; }
    public DateTime? DateBesoin              { get; set; }
    public string?   CodeSite                 { get; set; }
    public string?   CodeVariante             { get; set; }
    public decimal?  Longueur                 { get; set; }
    public decimal?  Largeur                  { get; set; }
    public decimal?  Poids                    { get; set; }
    public decimal?  Profondeur               { get; set; }
    public decimal?  CoutUnitaire             { get; set; }
    public decimal?  MontantCout              { get; set; }
    public decimal?  QuantitePrelevee         { get; set; }
    public bool?     ComplètementPrelevee     { get; set; }
    public decimal?  MontantCoutDirecte       { get; set; }
    public decimal?  MontantGeneraux          { get; set; }
}