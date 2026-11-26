using ArchLucid.Core.Http;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

using Polly;

namespace ArchLucid.Host.Core.Http;

/// <summary>
///     Wires <see cref="OutboundExternalHttpResiliencePolicy" /> onto named integration <see cref="HttpClient" /> builders.
/// </summary>
public static class OutboundExternalHttpClientBuilderExtensions
{
    private static readonly IAsyncPolicy<HttpResponseMessage> NoRetryPolicy = Policy.NoOpAsync<HttpResponseMessage>();

    /// <summary>
    ///     Adds retry + advanced circuit breaker from <see cref="OutboundExternalHttpResilienceOptions" />.
    /// </summary>
    public static IHttpClientBuilder AddOutboundExternalHttpResilience(this IHttpClientBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        return builder.AddLongLivedPolicyHandler(static services =>
        {
            OutboundExternalHttpResilienceOptions options =
                services.GetRequiredService<IOptions<OutboundExternalHttpResilienceOptions>>().Value;

            return OutboundExternalHttpResiliencePolicy.Create(options);
        });
    }

    /// <summary>
    ///     Shares a breaker across all requests on the client, but only retries bodyless GET and HEAD requests.
    ///     Use for clients whose writes have no verified upstream duplicate protection.
    /// </summary>
    public static IHttpClientBuilder AddOutboundExternalHttpResilienceForReadRetries(this IHttpClientBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        LongLivedHttpClientAsyncPolicy<HttpResponseMessage> readRetryPolicy = new(static services =>
        {
            OutboundExternalHttpResilienceOptions options =
                services.GetRequiredService<IOptions<OutboundExternalHttpResilienceOptions>>().Value;

            return OutboundExternalHttpResiliencePolicy.Create(new OutboundExternalHttpResilienceOptions
            {
                CircuitBreakerEnabled = false,
                MaxRetryAttempts = options.MaxRetryAttempts,
            });
        });

        // The outer handler records one completed outcome and can reject either a read or a write without sending it.
        return builder
            .AddLongLivedPolicyHandler(static services =>
            {
                OutboundExternalHttpResilienceOptions options =
                    services.GetRequiredService<IOptions<OutboundExternalHttpResilienceOptions>>().Value;

                return OutboundExternalHttpResiliencePolicy.Create(new OutboundExternalHttpResilienceOptions
                {
                    CircuitBreakerEnabled = options.CircuitBreakerEnabled,
                    FailureRatio = options.FailureRatio,
                    SamplingDurationSeconds = options.SamplingDurationSeconds,
                    MinimumThroughput = options.MinimumThroughput,
                    BreakDurationSeconds = options.BreakDurationSeconds,
                    MaxRetryAttempts = 0,
                });
            })
            .AddPolicyHandler((services, request) =>
                request.Content is null && (request.Method == HttpMethod.Get || request.Method == HttpMethod.Head)
                    ? readRetryPolicy.Get(services)
                    : NoRetryPolicy);
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

        return builder.AddLongLivedPolicyHandler(services =>
        {
            OutboundExternalHttpResilienceOptions options =
                services.GetRequiredService<IOptions<OutboundExternalHttpResilienceOptions>>().Value;

            return OutboundExternalHttpResiliencePolicy.Create(options, sleepDurationProvider);
        });
    }
}
