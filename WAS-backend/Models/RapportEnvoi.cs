namespace WAS_backend.Models;

public class RapportEnvoi
{
    public int      Id              { get; set; }
    public int      RapportId       { get; set; }
    public string   Destinataire    { get; set; } = string.Empty;
    public string   Sujet           { get; set; } = string.Empty;
    public string   Message         { get; set; } = string.Empty;
    public DateTime DateEnvoi       { get; set; } = DateTime.Now;
    public bool     Succes          { get; set; } = false;

    // Navigation
    public Rapport? Rapport { get; set; }
}