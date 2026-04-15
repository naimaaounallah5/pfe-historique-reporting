namespace WAS_backend.Services;

public interface IEmailService
{
    Task SendAsync(
        List<string> destinataires,
        string       sujet,
        string       message,
        Stream?      attachment     = null,
        string?      attachmentName = null
    );
}