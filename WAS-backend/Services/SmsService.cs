using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace WAS_backend.Services
{
    public class SmsService
    {
        private readonly IConfiguration _config;

        public SmsService(IConfiguration config)
        {
            _config = config;
        }

        public async Task EnvoyerSmsAsync(string message)
        {
            var accountSid = _config["Twilio:AccountSid"];
            var authToken  = _config["Twilio:AuthToken"];
            var from       = _config["Twilio:FromNumber"];
            var to         = _config["Twilio:ToNumber"];

            TwilioClient.Init(accountSid, authToken);

            await MessageResource.CreateAsync(
                body: message,
                from: new PhoneNumber(from),
                to:   new PhoneNumber(to)
            );
        }

        public async Task VerifierEtEnvoyerAlerteAsync(
            string machine,
            int qteProduite,
            int qteRebut,
            string statut,
            string numOrdre)
        {
            // Cas 1 : Taux rebut > 10%
            if (qteProduite > 0)
            {
                double tauxRebut = (double)qteRebut / qteProduite * 100;
                if (tauxRebut > 10)
                {
                    await EnvoyerSmsAsync(
                        $"[LMobile] ALERTE REBUT\n" +
                        $"Machine : {machine}\n" +
                        $"Qté Rebut : {qteRebut} pcs / {qteProduite} pcs produites\n" +
                        $"Taux : {tauxRebut:F1}%\n" +
                        $"Ordre : {numOrdre}\n" +
                        $"Statut : {statut}"
                    );
                }
            }

            // Cas 2 : Statut = Arrêt
            if (statut == "Arrêt")
            {
                await EnvoyerSmsAsync(
                    $"[LMobile] ARRÊT MACHINE\n" +
                    $"Machine : {machine}\n" +
                    $"Ordre : {numOrdre}\n" +
                    $"Statut : {statut}"
                );
            }
        }
    }
}