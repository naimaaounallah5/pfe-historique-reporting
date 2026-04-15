using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using WAS_backend.DTOs;
using WAS_backend.Hubs;
using WAS_backend.Services;

namespace WAS_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RapportsController : ControllerBase
{
    private readonly IRapportService           _service;
    private readonly IHubContext<ProductionHub> _hub;

    public RapportsController(
        IRapportService service,
        IHubContext<ProductionHub> hub)
    {
        _service = service;
        _hub     = hub;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? type,
        [FromQuery] string? statut,
        [FromQuery] string? format)
    {
        var rapports = await _service.GetAllAsync(search, type, statut, format);
        return Ok(rapports);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var rapport = await _service.GetByIdAsync(id);
        if (rapport == null) return NotFound(new { message = $"Rapport {id} introuvable." });
        return Ok(rapport);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRapportDTO dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Titre))
            return BadRequest(new { message = "Le titre est obligatoire." });

        var rapport = await _service.CreateAsync(dto);
        await _hub.Clients.All.SendAsync("RapportsMisAJour");
        Console.WriteLine("[SignalR] Nouveau rapport créé → notification envoyée.");
        return CreatedAtAction(nameof(GetById), new { id = rapport.Id }, rapport);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted) return NotFound(new { message = $"Rapport {id} introuvable." });

        await _hub.Clients.All.SendAsync("RapportsMisAJour");
        Console.WriteLine("[SignalR] Rapport supprimé → notification envoyée.");
        return NoContent();
    }

    // ✅ CORRIGÉ — accepter seq pour ID cohérent
    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(
        int id,
        [FromQuery] string format = "PDF",
        [FromQuery] int seq = 0) // ← AJOUT seq
    {
        try
        {
            if (format.ToUpper() == "CSV")
            {
                var excel = await _service.GenerateExcelAsync(id, seq);
                return File(
                    excel,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"rapport_{String.Format("{0:D3}", seq)}.xlsx"
                );
            }
            else
            {
                var pdf = await _service.GeneratePdfAsync(id, seq);
                return File(pdf, "application/pdf",
                    $"rapport_{String.Format("{0:D3}", seq)}.pdf");
            }
        }
        catch (KeyNotFoundException e) { return NotFound(new { message = e.Message }); }
    }

    [HttpGet("export-all")]
    public async Task<IActionResult> ExportAll([FromQuery] string format = "PDF")
    {
        if (format.ToUpper() == "CSV")
        {
            var excel = await _service.ExportAllExcelAsync();
            return File(
                excel,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "rapports_liste.xlsx"
            );
        }
        var pdf = await _service.ExportAllPdfAsync();
        return File(pdf, "application/pdf", "rapports_liste.pdf");
    }

    [HttpPost("{id}/envoyer")]
    public async Task<IActionResult> Envoyer(int id, [FromForm] EnvoyerRapportDTO dto)
    {
        if (dto.Destinataires == null || dto.Destinataires.Count == 0)
            return BadRequest(new { message = "Au moins un destinataire est requis." });
        if (string.IsNullOrWhiteSpace(dto.Sujet))
            return BadRequest(new { message = "Le sujet est obligatoire." });
        try
        {
            await _service.EnvoyerAsync(id, dto);
            await _hub.Clients.All.SendAsync("RapportsMisAJour");
            Console.WriteLine("[SignalR] Rapport envoyé → notification envoyée.");
            return Ok(new { message = "Rapport envoyé avec succès." });
        }
        catch (KeyNotFoundException e) { return NotFound(new { message = e.Message }); }
        catch (Exception e) { return StatusCode(500, new { message = "Erreur envoi email.", detail = e.Message }); }
    }
}