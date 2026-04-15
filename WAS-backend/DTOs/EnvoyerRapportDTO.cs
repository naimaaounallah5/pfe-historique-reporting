namespace WAS_backend.DTOs;

public class EnvoyerRapportDTO
{
    public List<string> Destinataires { get; set; } = new();
    
    public string Sujet { get; set; } = string.Empty;
    
    public string? Message { get; set; } = string.Empty; // ← pas [Required] !
    
    public IFormFile? PieceJointe { get; set; } // ← doit être nullable
}