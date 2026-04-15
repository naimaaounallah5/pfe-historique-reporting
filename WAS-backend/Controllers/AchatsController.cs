// ============================================================
//  AchatsController.cs — Controller REST pour les KPIs Achats
//  Expose les endpoints HTTP pour le frontend React
//
//  Endpoints disponibles :
//  GET /api/achats/dashboard  → toutes les données en un appel
//  GET /api/achats/global     → KPI global seulement
//  GET /api/achats/fournisseur→ données par fournisseur
//  GET /api/achats/temps      → données par mois
//  GET /api/achats/produit    → données par produit
//  GET /api/achats/filters    → filtres disponibles
//
//  Paramètres de filtre (query string) :
//  ?annee=2024&trimestre=1&fournisseur=Jean Dupont&produit=Acier
// ============================================================

using Microsoft.AspNetCore.Mvc;
using WAS_backend.DTOs;
using WAS_backend.Services;

namespace WAS_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AchatsController : ControllerBase
    {
        private readonly IAchatsService _service;

        public AchatsController(IAchatsService service)
        {
            _service = service;
        }

        // ============================================================
        // GET /api/achats/dashboard
        // Retourne TOUTES les données en un seul appel
        // C'est l'endpoint principal utilisé par le frontend
        // Exemple : GET /api/achats/dashboard?annee=2024&trimestre=1
        // ============================================================
        [HttpGet("dashboard")]
        public async Task<ActionResult<AchatsResponseDTO>> GetDashboard(
            [FromQuery] int?    annee       = null,
            [FromQuery] int?    trimestre   = null,
            [FromQuery] string? fournisseur = null,
            [FromQuery] string? produit     = null)
        {
            try
            {
                var result = await _service.GetAchatsResponseAsync(
                    annee, trimestre, fournisseur, produit);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // ============================================================
        // GET /api/achats/global
        // Retourne uniquement le KPI global
        // Utilisé pour la KPI Card en haut du dashboard
        // Exemple : GET /api/achats/global?annee=2024
        // ============================================================
        [HttpGet("global")]
        public async Task<ActionResult<AchatsKpiGlobalDTO>> GetKpiGlobal(
            [FromQuery] int?    annee       = null,
            [FromQuery] int?    trimestre   = null,
            [FromQuery] string? fournisseur = null,
            [FromQuery] string? produit     = null)
        {
            try
            {
                var result = await _service.GetKpiGlobalAsync(
                    annee, trimestre, fournisseur, produit);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // ============================================================
        // GET /api/achats/fournisseur
        // Retourne le montant total par fournisseur
        // Utilisé pour le Bar Chart horizontal
        // Exemple : GET /api/achats/fournisseur?annee=2024
        // ============================================================
        [HttpGet("fournisseur")]
        public async Task<ActionResult<List<AchatParFournisseurDTO>>> GetParFournisseur(
            [FromQuery] int?    annee     = null,
            [FromQuery] int?    trimestre = null,
            [FromQuery] string? produit   = null)
        {
            try
            {
                var result = await _service.GetParFournisseurAsync(
                    annee, trimestre, produit);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // ============================================================
        // GET /api/achats/temps
        // Retourne le montant total par mois
        // Utilisé pour le Line Chart
        // Exemple : GET /api/achats/temps?annee=2024&trimestre=2
        // ============================================================
        [HttpGet("temps")]
        public async Task<ActionResult<List<AchatParTempsDTO>>> GetParTemps(
            [FromQuery] int?    annee       = null,
            [FromQuery] int?    trimestre   = null,
            [FromQuery] string? fournisseur = null,
            [FromQuery] string? produit     = null)
        {
            try
            {
                var result = await _service.GetParTempsAsync(
                    annee, trimestre, fournisseur, produit);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // ============================================================
        // GET /api/achats/produit
        // Retourne le montant total par produit
        // Utilisé pour le Bar Chart vertical ou Pie Chart
        // Exemple : GET /api/achats/produit?annee=2024
        // ============================================================
        [HttpGet("produit")]
        public async Task<ActionResult<List<AchatParProduitDTO>>> GetParProduit(
            [FromQuery] int?    annee       = null,
            [FromQuery] int?    trimestre   = null,
            [FromQuery] string? fournisseur = null)
        {
            try
            {
                var result = await _service.GetParProduitAsync(
                    annee, trimestre, fournisseur);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // ============================================================
        // GET /api/achats/filters
        // Retourne les valeurs disponibles pour les filtres
        // Utilisé pour remplir les listes déroulantes
        // Exemple : GET /api/achats/filters
        // ============================================================
        [HttpGet("filters")]
        public async Task<ActionResult<AchatsFiltersDTO>> GetFilters()
        {
            try
            {
                var result = await _service.GetFiltersAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
        // ============================================================
// GET /api/achats/retard
// Retard Livraison par Fournisseur / Temps / Produit
// Exemple : GET /api/achats/retard?annee=2024&trimestre=1
// ============================================================
[HttpGet("retard")]
public async Task<ActionResult<RetardResponseDTO>> GetRetard(
    [FromQuery] int?    annee       = null,
    [FromQuery] int?    trimestre   = null,
    [FromQuery] string? fournisseur = null,
    [FromQuery] string? produit     = null)
{
    try
    {
        var result = await _service.GetRetardResponseAsync(
            annee, trimestre, fournisseur, produit);
        return Ok(result);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = ex.Message });
    }
}
    }
}