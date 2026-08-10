using System.Net.Http;

using ArchLucid.Core.Http;

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
        OutboundHttpSocketsHandlerProfile profile = OutboundHttpSocketsHandlerProfile.ExternalIntegration)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ConfigurePrimaryHttpMessageHandler(() =>
        {
            SocketsHttpHandler handler = new();
            OutboundSocketsHttpHandlerSettings.Apply(handler, profile);

            return handler;
        });

        builder.SetHandlerLifetime(Timeout.InfiniteTimeSpan);

        return builder;
    }
}
