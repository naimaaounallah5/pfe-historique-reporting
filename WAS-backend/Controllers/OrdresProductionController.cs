using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR; // ✅ AJOUT
using WAS_backend.Hubs;             // ✅ AJOUT
using WAS_backend.Services;

namespace WAS_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdresProductionController : ControllerBase
{
    private readonly IOrdreProductionService _service;
    private readonly IHubContext<ProductionHub> _hub; // ✅ AJOUT

    public OrdresProductionController(
        IOrdreProductionService service,
        IHubContext<ProductionHub> hub) // ✅ AJOUT
    {
        _service = service;
        _hub     = hub;
    }

    // GET /api/ordresproduction
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] int?    statut,
        [FromQuery] string? codeSite)
    {
        var ordres = await _service.GetAllAsync(search, statut, codeSite);
        return Ok(ordres);
    }

    // GET /api/ordresproduction/{numero}/detail
    [HttpGet("{numero}/detail")]
    public async Task<IActionResult> GetDetail(string numero)
    {
        var detail = await _service.GetDetailAsync(numero);
        if (detail == null) return NotFound(new { message = $"Ordre {numero} introuvable." });
        return Ok(detail);
    }

    // ✅ NOUVEAU — endpoint pour notifier manuellement (test)
    // POST /api/ordresproduction/notifier
    [HttpPost("notifier")]
    public async Task<IActionResult> Notifier()
    {
        await _hub.Clients.All.SendAsync("OrdresMisAJour");
        return Ok(new { message = "Notification envoyée à tous les clients." });
    }

    // GET /api/ordresproduction/export-tableau-pdf
    [HttpGet("export-tableau-pdf")]
    public async Task<IActionResult> ExportTableauPdf(
        [FromQuery] string? search,
        [FromQuery] int?    statut,
        [FromQuery] string? codeSite)
    {
        var pdf = await _service.ExportTableauPdfAsync(search, statut, codeSite);
        return File(pdf, "application/pdf", "ordres_production.pdf");
    }

    // GET /api/ordresproduction/export-tableau-excel
    [HttpGet("export-tableau-excel")]
    public async Task<IActionResult> ExportTableauExcel(
        [FromQuery] string? search,
        [FromQuery] int?    statut,
        [FromQuery] string? codeSite)
    {
        var excel = await _service.ExportTableauExcelAsync(search, statut, codeSite);
        return File(excel, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "ordres_production.xlsx");
    }

    // GET /api/ordresproduction/{numero}/export-pdf
    [HttpGet("{numero}/export-pdf")]
    public async Task<IActionResult> ExportOrdrePdf(string numero)
    {
        try
        {
            var pdf = await _service.ExportOrdrePdfAsync(numero);
            return File(pdf, "application/pdf", $"ordre_{numero}.pdf");
        }
        catch (KeyNotFoundException e) { return NotFound(new { message = e.Message }); }
    }

    // GET /api/ordresproduction/{numero}/export-excel
    [HttpGet("{numero}/export-excel")]
    public async Task<IActionResult> ExportOrdreExcel(string numero)
    {
        try
        {
            var excel = await _service.ExportOrdreExcelAsync(numero);
            return File(excel, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"ordre_{numero}.xlsx");
        }
        catch (KeyNotFoundException e) { return NotFound(new { message = e.Message }); }
    }
}