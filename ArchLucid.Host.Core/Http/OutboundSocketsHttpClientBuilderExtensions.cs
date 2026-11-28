using System.Net.Http;

using ArchLucid.Core.Http;
using ArchLucid.Core.Security;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Core.Http;

/// <summary>
///     Wires tuned <see cref="SocketsHttpHandler" /> pools onto <see cref="IHttpClientFactory" /> builders (TB-2163).
/// </summary>
public static class OutboundSocketsHttpClientBuilderExtensions
{
    /// <summary>
    ///     Configures a primary <see cref="SocketsHttpHandler" /> and defers handler recycling to
    ///     <see cref="SocketsHttpHandler.PooledConnectionLifetime" />.
    /// </summary>
    public static IHttpClientBuilder ConfigureArchLucidOutboundSocketsHandler(
        this IHttpClientBuilder builder,
        OutboundHttpSocketsHandlerProfile profile = OutboundHttpSocketsHandlerProfile.ExternalIntegration,
        bool allowAutoRedirect = true,
        bool rejectPrivateNetworkConnectEndpoints = false) =>
        builder.ConfigureArchLucidOutboundSocketsHandler(
            profile, allowAutoRedirect, rejectPrivateNetworkConnectEndpoints, useCookies: true);

    /// <summary>Configures the tuned pool with an explicit cookie policy.</summary>
    public static IHttpClientBuilder ConfigureArchLucidOutboundSocketsHandler(
        this IHttpClientBuilder builder,
        OutboundHttpSocketsHandlerProfile profile,
        bool allowAutoRedirect,
        bool rejectPrivateNetworkConnectEndpoints,
        bool useCookies)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ConfigurePrimaryHttpMessageHandler(() =>
        {
            SocketsHttpHandler handler = new() { AllowAutoRedirect = allowAutoRedirect, UseCookies = useCookies };

            if (rejectPrivateNetworkConnectEndpoints)
            {
                handler.ConnectCallback = OutboundHttpsConnectGuard.RejectPrivateNetworkAndConnectAsync;
            }

            OutboundSocketsHttpHandlerSettings.Apply(handler, profile);

            return handler;
        });

        builder.SetHandlerLifetime(Timeout.InfiniteTimeSpan);

        return builder;
    }
}
