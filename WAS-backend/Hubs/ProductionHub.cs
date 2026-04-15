using Microsoft.AspNetCore.SignalR;

namespace WAS_backend.Hubs;

public class ProductionHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        Console.WriteLine($"[SignalR] Client connecté : {Context.ConnectionId}");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine($"[SignalR] Client déconnecté : {Context.ConnectionId}");
        await base.OnDisconnectedAsync(exception);
    }
}