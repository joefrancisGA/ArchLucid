using System.Net;

using ArchLucid.Core.Http;

using Polly;
using Polly.CircuitBreaker;
using Polly.Retry;

namespace ArchLucid.Host.Core.Http;

/// <summary>
///     Polly v8 retry plus ratio-based circuit breaker for outbound integration <see cref="HttpClient" /> instances
///     (webhooks, ITSM, billing marketplace, Confluence, and similar).
/// </summary>
public static class OutboundExternalHttpResiliencePolicy
{
    /// <summary>
    ///     Production policy: exponential retry on transient faults, then advanced circuit breaker on sustained failure rate.
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> Create(OutboundExternalHttpResilienceOptions options) =>
        Create(options, static attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)));

    /// <summary>
    ///     Identical fault handling with injectable backoff (zero delay in tests).
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> Create(
        OutboundExternalHttpResilienceOptions options,
        Func<int, TimeSpan> sleepDurationProvider)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(sleepDurationProvider);

        OutboundExternalHttpResilienceOptions normalized = CloneNormalized(options);

        // Register retry first so it sits innermost; circuit breaker second so it wraps retries and fails fast when open.
        ResiliencePipelineBuilder<HttpResponseMessage> builder = new();

        if (normalized.MaxRetryAttempts > 0)
        {
            builder.AddRetry(new RetryStrategyOptions<HttpResponseMessage>
            {
                MaxRetryAttempts = normalized.MaxRetryAttempts,
                ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                    .Handle<HttpRequestException>()
                    .HandleResult(ShouldRetryOutboundResponse),
                DelayGenerator = args =>
                {
                    TimeSpan delay = sleepDurationProvider(args.AttemptNumber);

                    return new ValueTask<TimeSpan?>(delay);
                },
            });
        }

        if (normalized.CircuitBreakerEnabled)
        {
            int minimumThroughput = normalized.MinimumThroughput;

            if (normalized.MaxRetryAttempts > 0)
            {
                // Outer breaker records each retry attempt; scale so MinimumThroughput stays in logical-call units.
                minimumThroughput = normalized.MinimumThroughput * (normalized.MaxRetryAttempts + 1);
            }

            builder.AddCircuitBreaker(new CircuitBreakerStrategyOptions<HttpResponseMessage>
            {
                FailureRatio = normalized.FailureRatio,
                SamplingDuration = TimeSpan.FromSeconds(normalized.SamplingDurationSeconds),
                MinimumThroughput = minimumThroughput,
                BreakDuration = TimeSpan.FromSeconds(normalized.BreakDurationSeconds),
                ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                    .Handle<HttpRequestException>()
                    .HandleResult(CountsAsCircuitBreakerFailure),
            });
        }

        ResiliencePipeline<HttpResponseMessage> pipeline = builder.Build();

        return pipeline.AsAsyncPolicy();
    }

    private static OutboundExternalHttpResilienceOptions CloneNormalized(OutboundExternalHttpResilienceOptions source)
    {
        OutboundExternalHttpResilienceOptions clone = new()
        {
            CircuitBreakerEnabled = source.CircuitBreakerEnabled,
            FailureRatio = source.FailureRatio,
            SamplingDurationSeconds = source.SamplingDurationSeconds,
            MinimumThroughput = source.MinimumThroughput,
            BreakDurationSeconds = source.BreakDurationSeconds,
            MaxRetryAttempts = source.MaxRetryAttempts,
        };

        clone.Normalize();

        return clone;
    }

    /// <summary>Transient HTTP outcomes that consume retry budget.</summary>
    private static bool ShouldRetryOutboundResponse(HttpResponseMessage response)
    {
        HttpStatusCode code = response.StatusCode;

        if (code == HttpStatusCode.RequestTimeout)
            return true;

        if (code == HttpStatusCode.TooManyRequests)
            return true;

        return (int)code >= 500 && (int)code < 600;
    }

    /// <summary>Failures that count toward the ratio-based breaker (includes 401/403 to avoid hammering bad credentials).</summary>
    private static bool CountsAsCircuitBreakerFailure(HttpResponseMessage response)
    {
        HttpStatusCode code = response.StatusCode;

        if (code == HttpStatusCode.Unauthorized || code == HttpStatusCode.Forbidden)
            return true;

        return ShouldRetryOutboundResponse(response);
    }
}
