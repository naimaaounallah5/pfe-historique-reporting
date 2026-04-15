// ============================================================
//  DashboardHub.cs — Hub SignalR dédié au Dashboard KPIs
//  Séparé de ProductionHub — aucune interférence
// ============================================================
using Microsoft.AspNetCore.SignalR;

namespace WAS_backend.Hubs
{
    public class DashboardHub : Hub
    {
        // Les clients s'abonnent ici
        // Le backend appelle NotifierMiseAJour() quand les données changent
    }
}