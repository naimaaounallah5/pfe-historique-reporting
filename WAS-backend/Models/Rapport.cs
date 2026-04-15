using System.ComponentModel.DataAnnotations.Schema;

namespace WAS_backend.Models;

public class Rapport
{
    public int     Id               { get; set; }
    public string  Titre            { get; set; } = string.Empty;
    public string  Type             { get; set; } = string.Empty;
    public string  Format           { get; set; } = string.Empty;
    public string  Statut           { get; set; } = "Créé";
    public string  Contenu          { get; set; } = string.Empty;
    public string? OptionsData      { get; set; }
    public string? Responsable      { get; set; }
    public int     AdministrateurId { get; set; } = 1;

    // ✅ CORRIGÉ — forcer datetime au lieu de datetime2
    [Column(TypeName = "datetime")]
    public DateTime? DateRapport  { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime  DateCreation { get; set; } = DateTime.Now;

    public ICollection<RapportEnvoi> Envois { get; set; } = new List<RapportEnvoi>();
}
