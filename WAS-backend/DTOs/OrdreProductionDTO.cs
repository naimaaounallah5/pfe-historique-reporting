using WAS_backend.Models;

namespace WAS_backend.DTOs;

public class OrdreProductionDetailDTO
{
    public OrdreProduction?              Ordre      { get; set; }
    public List<LigneOrdreProduction>    Lignes     { get; set; } = new();
    public List<ComposantOrdre>          Composants { get; set; } = new();
    public List<OperationGamme>          Operations { get; set; } = new();
}