using Microsoft.AspNetCore.Mvc;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Options;
using WAS_backend.Services;

namespace WAS_backend.Controllers
{
    [ApiController]
    [Route("api/email")]
    public class EmailHistoriqueController : ControllerBase
    {
        private readonly EmailSettings _settings;

        public EmailHistoriqueController(IConfiguration config)
        {
            _settings = config.GetSection("EmailSettings").Get<EmailSettings>()!;
        }

        [HttpPost("historique")]
        public async Task<IActionResult> EnvoyerEmailHistorique(
            [FromBody] EmailHistoriqueRequest request)
        {
            try
            {
                var email = new MimeMessage();
                email.From.Add(new MailboxAddress(_settings.FromName, _settings.FromEmail));
                email.To.Add(MailboxAddress.Parse(request.Destinataire));
                email.Subject = request.Sujet;

                var builder = new BodyBuilder
                {
                    HtmlBody = request.Corps
                };
                email.Body = builder.ToMessageBody();

                using var smtp = new SmtpClient();
                await smtp.ConnectAsync(_settings.Host, _settings.Port, SecureSocketOptions.Auto);
                await smtp.AuthenticateAsync(_settings.Username, _settings.Password);
                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);

                return Ok(new { message = "Email envoyé avec succès" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Erreur : {ex.Message}" });
            }
        }
    }

    public class EmailHistoriqueRequest
    {
        public string Destinataire { get; set; } = "";
        public string Sujet        { get; set; } = "";
        public string Corps        { get; set; } = "";
    }
}