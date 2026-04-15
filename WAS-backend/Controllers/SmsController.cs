using Microsoft.AspNetCore.Mvc;
using WAS_backend.Services;

namespace WAS_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SmsController : ControllerBase
    {
        private readonly SmsService _smsService;

        public SmsController(SmsService smsService)
        {
            _smsService = smsService;
        }

        // Envoi manuel depuis le Frontend
        [HttpPost("envoyer")]
        public async Task<IActionResult> EnvoyerSms([FromBody] SmsRequest request)
        {
            await _smsService.EnvoyerSmsAsync(request.Message);
            return Ok(new { success = true, message = "SMS envoyé avec succès ✅" });
        }

        // Vérification automatique anomalie
        [HttpPost("verifier-anomalie")]
        public async Task<IActionResult> VerifierAnomalie([FromBody] AnomalieRequest request)
        {
            await _smsService.VerifierEtEnvoyerAlerteAsync(
                request.Machine,
                request.QteProduite,
                request.QteRebut,
                request.Statut,
                request.NumOrdre
            );
            return Ok(new { success = true });
        }
    }

    public class SmsRequest
    {
        public string Message { get; set; } = string.Empty;
    }

    public class AnomalieRequest
    {
        public string Machine { get; set; } = string.Empty;
        public int QteProduite { get; set; }
        public int QteRebut { get; set; }
        public string Statut { get; set; } = string.Empty;
        public string NumOrdre { get; set; } = string.Empty;
    }
}