using System.Net.Http;

namespace ArchLucid.Core.Http;

/// <summary>
///     Applies per-profile <see cref="SocketsHttpHandler" /> pool settings (TB-2163).
/// </summary>
public static class OutboundSocketsHttpHandlerSettings
{
    public static void Apply(SocketsHttpHandler handler, OutboundHttpSocketsHandlerProfile profile)
    {
        ArgumentNullException.ThrowIfNull(handler);

        switch (profile)
        {
            case OutboundHttpSocketsHandlerProfile.InternalLoopback:
                handler.PooledConnectionLifetime = TimeSpan.FromMinutes(2);
                handler.PooledConnectionIdleTimeout = TimeSpan.FromMinutes(1);
                handler.MaxConnectionsPerServer = 4;
                handler.EnableMultipleHttp2Connections = false;
                break;

            case OutboundHttpSocketsHandlerProfile.ExternalIntegration:
                handler.PooledConnectionLifetime = TimeSpan.FromMinutes(5);
                handler.PooledConnectionIdleTimeout = TimeSpan.FromMinutes(2);
                handler.MaxConnectionsPerServer = 20;
                handler.EnableMultipleHttp2Connections = true;
                break;

            case OutboundHttpSocketsHandlerProfile.CloudControlPlane:
                handler.PooledConnectionLifetime = TimeSpan.FromMinutes(5);
                handler.PooledConnectionIdleTimeout = TimeSpan.FromMinutes(2);
                handler.MaxConnectionsPerServer = 50;
                handler.EnableMultipleHttp2Connections = true;
                break;

            case OutboundHttpSocketsHandlerProfile.LlmCompletion:
                handler.PooledConnectionLifetime = TimeSpan.FromMinutes(10);
                handler.PooledConnectionIdleTimeout = TimeSpan.FromMinutes(5);
                handler.MaxConnectionsPerServer = 20;
                handler.EnableMultipleHttp2Connections = true;
                break;

            default:
                throw new ArgumentOutOfRangeException(nameof(profile), profile, "Unknown outbound HTTP sockets profile.");
        }
    }
}
