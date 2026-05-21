using ArchLucid.Core.Http;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Http;

/// <summary>
///     Wires <see cref="OutboundExternalHttpResiliencePolicy" /> onto named integration <see cref="HttpClient" /> builders.
/// </summary>
public static class OutboundExternalHttpClientBuilderExtensions
{
    /// <summary>
    ///     Adds retry + advanced circuit breaker from <see cref="OutboundExternalHttpResilienceOptions" />.
    /// </summary>
    public static IHttpClientBuilder AddOutboundExternalHttpResilience(this IHttpClientBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        return builder.AddPolicyHandler(static (services, _) =>
        {
            OutboundExternalHttpResilienceOptions options =
                services.GetRequiredService<IOptions<OutboundExternalHttpResilienceOptions>>().Value;

            return OutboundExternalHttpResiliencePolicy.Create(options);
        });
    }

    /// <summary>
    ///     Test hook: inject zero-delay retry backoff while keeping production breaker thresholds.
    /// </summary>
    public static IHttpClientBuilder AddOutboundExternalHttpResilience(
        this IHttpClientBuilder builder,
        Func<int, TimeSpan> sleepDurationProvider)
    {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentNullException.ThrowIfNull(sleepDurationProvider);

        return builder.AddPolicyHandler((services, _) =>
        {
            OutboundExternalHttpResilienceOptions options =
                services.GetRequiredService<IOptions<OutboundExternalHttpResilienceOptions>>().Value;

            return OutboundExternalHttpResiliencePolicy.Create(options, sleepDurationProvider);
        });
    }
}
