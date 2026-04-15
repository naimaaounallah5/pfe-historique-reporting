using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace WAS_backend.Services;

public class EmailSettings
{
    public string Host      { get; set; } = string.Empty;
    public int    Port      { get; set; } = 587;
    public string Username  { get; set; } = string.Empty;
    public string Password  { get; set; } = string.Empty;
    public string FromName  { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
}

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _settings = config.GetSection("EmailSettings").Get<EmailSettings>()!;
        _logger   = logger;
    }

    public async Task SendAsync(
        List<string> destinataires,
        string       sujet,
        string       message,
        Stream?      attachment     = null,
        string?      attachmentName = null)
    {
        var email = new MimeMessage();
        email.From.Add(new MailboxAddress(_settings.FromName, _settings.FromEmail));

        foreach (var dest in destinataires)
            email.To.Add(MailboxAddress.Parse(dest));

        email.Subject = sujet;

        var htmlContent = ConvertTextToHtml(message);

        var builder = new BodyBuilder
        {
            HtmlBody = $@"
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='margin:0;padding:0;background:#F3F4F6;font-family:Inter,Segoe UI,Arial,sans-serif'>
  <div style='max-width:800px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)'>

    <!-- HEADER -->
    <div style='background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);padding:32px 48px'>
      <div style='display:flex;align-items:center;gap:24px'>
        <div style='background:white;border-radius:12px;padding:10px 18px;display:inline-block;flex-shrink:0'>
          <span style='font-size:26px;font-weight:900;color:#4F46E5;letter-spacing:-1px'>L</span><span style='font-size:18px;font-weight:700;color:#374151'>·MOBILE</span>
        </div>
        <div style='width:1px;height:48px;background:rgba(255,255,255,0.3)'></div>
        <div>
          <div style='color:white;font-size:24px;font-weight:800;margin:0;letter-spacing:-0.5px'>I-mobile WAS</div>
          <div style='color:rgba(255,255,255,0.75);font-size:14px;margin-top:4px'>Historical Data &amp; Reporting</div>
        </div>
      </div>
    </div>

    <!-- CONTENU -->
    <div style='padding:36px 48px'>
      {htmlContent}
    </div>

    <!-- FOOTER -->
    <div style='background:#F8FAFC;border-top:1px solid #E5E7EB;padding:20px 48px;text-align:center'>
      <p style='color:#9CA3AF;font-size:12px;margin:0'>
        Ce message a été envoyé automatiquement par <strong>I-mobile WAS </strong> 
      </p>
    </div>

  </div>
</body>
</html>"
        };

        if (attachment != null && attachmentName != null)
            builder.Attachments.Add(attachmentName, attachment);

        email.Body = builder.ToMessageBody();

        using var smtp = new SmtpClient();
        try
        {
            await smtp.ConnectAsync(_settings.Host, _settings.Port, SecureSocketOptions.Auto);
            await smtp.AuthenticateAsync(_settings.Username, _settings.Password);
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
            _logger.LogInformation("Email envoyé à {Destinataires}", string.Join(", ", destinataires));
        }
        catch (Exception ex)
        {
            _logger.LogError("ERREUR EMAIL: {Message} | Inner: {Inner}", ex.Message, ex.InnerException?.Message);
            throw;
        }
    }

    private static string ConvertTextToHtml(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return "";

        var sb = new System.Text.StringBuilder();
        var lines = text.Split('\n');
        bool tableOpen = false;

        foreach (var line in lines)
        {
            var l = line.TrimEnd();

            if (l.StartsWith("═══"))
            {
                if (tableOpen) { sb.AppendLine("</table></div>"); tableOpen = false; }
                sb.AppendLine("<hr style='border:none;border-top:2px solid #E5E7EB;margin:20px 0'>");
                continue;
            }
            if (l.StartsWith("───"))
            {
                sb.AppendLine("<hr style='border:none;border-top:1px solid #F3F4F6;margin:10px 0'>");
                continue;
            }
            if (l.TrimStart().StartsWith("RAPPORT :"))
            {
                var val = l.Replace("RAPPORT :", "").Trim();
                sb.AppendLine($"<h2 style='font-size:20px;font-weight:700;color:#111827;margin:10px 0'>{val}</h2>");
                continue;
            }
            if (l.TrimStart().StartsWith("📝 DESCRIPTION"))
            {
                sb.AppendLine("<div style='margin-top:20px'><p style='font-size:13px;font-weight:700;color:#4F46E5;margin:0 0 8px'>📝 DESCRIPTION</p>");
                continue;
            }
            if (l.TrimStart().StartsWith("📊 DÉTAILS"))
            {
                if (tableOpen) { sb.AppendLine("</table></div>"); tableOpen = false; }
                var val = l.Trim();
                sb.AppendLine($"<div style='margin-top:24px'><p style='font-size:13px;font-weight:700;color:#4F46E5;margin:0 0 12px'>{val}</p>");
                sb.AppendLine("<table style='width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden'>");
                tableOpen = true;
                continue;
            }
            if (l.TrimStart().StartsWith("•"))
            {
                var content = l.TrimStart().Substring(1).Trim();
                var colonIdx = content.IndexOf(':');
                if (colonIdx > 0)
                {
                    var label = content.Substring(0, colonIdx).Trim();
                    var value = content.Substring(colonIdx + 1).Trim();
                    sb.AppendLine($@"<tr>
                      <td style='padding:10px 16px;background:#EEF2FF;font-size:12px;font-weight:600;color:#4F46E5;border-bottom:1px solid #E5E7EB;width:40%'>{label}</td>
                      <td style='padding:10px 16px;background:#fff;font-size:13px;color:#111827;border-bottom:1px solid #E5E7EB'>{value}</td>
                    </tr>");
                }
                continue;
            }
            if (l.Contains(":") && l.TrimStart().Length > 2 && !l.StartsWith("Bonjour") && !l.StartsWith("Cordialement"))
            {
                var colonIdx = l.IndexOf(':');
                if (colonIdx > 0 && colonIdx < 25)
                {
                    var label = l.Substring(0, colonIdx).Trim();
                    var value = l.Substring(colonIdx + 1).Trim();
                    if (!string.IsNullOrEmpty(value))
                    {
                        sb.AppendLine($"<p style='margin:6px 0;font-size:13px;color:#374151'><span style='font-weight:600;color:#6B7280;min-width:130px;display:inline-block'>{label} :</span> {value}</p>");
                        continue;
                    }
                }
            }
            if (string.IsNullOrWhiteSpace(l))
                sb.AppendLine("<br>");
            else
                sb.AppendLine($"<p style='margin:6px 0;font-size:13px;color:#374151'>{System.Net.WebUtility.HtmlEncode(l)}</p>");
        }

        if (tableOpen) sb.AppendLine("</table></div>");

        return sb.ToString();
    }
}