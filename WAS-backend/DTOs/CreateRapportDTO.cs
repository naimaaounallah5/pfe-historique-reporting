namespace WAS_backend.DTOs;

public class CreateRapportDTO
{
    public string  Titre            { get; set; } = string.Empty;
    public string  Type             { get; set; } = string.Empty;
    public string  Format           { get; set; } = string.Empty;
    public string  Contenu          { get; set; } = string.Empty;
    public string? OptionsData      { get; set; }
    public string? Responsable      { get; set; }
    public string? DateRapport      { get; set; }  // ✅ un seul champ
    public int     AdministrateurId { get; set; } = 1;
}