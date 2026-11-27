using ArchLucid.Core.Http;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Polly;
using Polly.Retry;

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

    /// <summary>Bounds concurrency, samples completed calls, and retries only verified reads.</summary>
    public static IHttpClientBuilder AddOutboundExternalHttpResilienceForReadRetries(
        this IHttpClientBuilder builder,
        int callTimeoutSeconds = OutboundHttpClientTimeoutSeconds.ExternalIntegration,
        Func<HttpRequestMessage, bool>? isVerifiedRead = null)
    {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(callTimeoutSeconds);
        TimeSpan callBudget = TimeSpan.FromSeconds(callTimeoutSeconds);
        Func<HttpRequestMessage, bool> canRetry = isVerifiedRead ?? IsBodylessRead;

        LongLivedHttpClientAsyncPolicy<HttpResponseMessage> readRetryPolicy = new(services =>
        {
            OutboundExternalHttpResilienceOptions options =
                services.GetRequiredService<IOptions<OutboundExternalHttpResilienceOptions>>().Value;
            int attempts = Math.Clamp(options.MaxRetryAttempts, 0, 10);

            if (attempts == 0)
                return NoRetryPolicy;

            TimeProvider clock = services.GetService<TimeProvider>() ?? TimeProvider.System;
            ILogger logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("OutboundHttp.ReadRetry");
            DeadlineAwareReadRetryTiming timing = new(clock, callBudget, attempts);

            return new ResiliencePipelineBuilder<HttpResponseMessage> { TimeProvider = clock }
                .AddStrategy(_ => timing)
                .AddRetry(timing.CreateRetryOptions(args => AzureRmAndRetailPricesHttpRetryPolicy.TryLogRetry(logger, args)))
                .Build()
                .AsAsyncPolicy();
        });

        return builder
            .AddLongLivedPolicyHandler(static services =>
            {
                OutboundExternalHttpResilienceOptions options =
                    services.GetRequiredService<IOptions<OutboundExternalHttpResilienceOptions>>().Value;
                TimeProvider clock = services.GetService<TimeProvider>() ?? TimeProvider.System;

                // Hold a logical-call slot across backoff, outside the breaker so local rejections do not trip it.
                return OutboundExternalHttpResiliencePolicy.CreateBreakerOnly(options, clock, MaxConcurrentIntegrationCalls);
            })
            .AddPolicyHandler((services, request) => canRetry(request) ? readRetryPolicy.Get(services) : NoRetryPolicy);
    }

    private const int MaxConcurrentIntegrationCalls = 20;

    internal static bool IsBodylessRead(HttpRequestMessage request) =>
        request.Content is null && (request.Method == HttpMethod.Get || request.Method == HttpMethod.Head);

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
