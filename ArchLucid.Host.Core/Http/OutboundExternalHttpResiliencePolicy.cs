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
    ///     Production policy: a circuit breaker around exponential retry, sampling one outcome per logical call.
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
        ArgumentNullException.ThrowIfNull(sleepDurationProvider);

        return Build(options, sleepDurationProvider, TimeProvider.System, maxConcurrentCalls: null);
    }

    /// <summary>Per-client or per-destination admission and breaker without any automatic replay.</summary>
    public static IAsyncPolicy<HttpResponseMessage> CreateBreakerOnly(
        OutboundExternalHttpResilienceOptions options, TimeProvider clock, int maxConcurrentCalls)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(maxConcurrentCalls);

        return Build(options, sleepDurationProvider: null, clock, maxConcurrentCalls);
    }

    private static IAsyncPolicy<HttpResponseMessage> Build(
        OutboundExternalHttpResilienceOptions options, Func<int, TimeSpan>? sleepDurationProvider,
        TimeProvider clock, int? maxConcurrentCalls)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(clock);

        OutboundExternalHttpResilienceOptions normalized = CloneNormalized(options);

        // Polly applies strategies outermost-first. The breaker sees one final outcome,
        // not each individual retry, and rejects an open circuit before any send.
        ResiliencePipelineBuilder<HttpResponseMessage> builder = new() { TimeProvider = clock };

        if (maxConcurrentCalls is int capacity)
        {
            builder.AddStrategy(_ => new OutboundLogicalCallCapacity(
                capacity, "Local outbound client concurrency limit reached"));
        }

        if (normalized.CircuitBreakerEnabled)
        {
            builder.AddCircuitBreaker(new CircuitBreakerStrategyOptions<HttpResponseMessage>
            {
                FailureRatio = normalized.FailureRatio,
                SamplingDuration = TimeSpan.FromSeconds(normalized.SamplingDurationSeconds),
                MinimumThroughput = normalized.MinimumThroughput,
                BreakDuration = TimeSpan.FromSeconds(normalized.BreakDurationSeconds),
                ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                    .Handle<HttpRequestException>()
                    .HandleResult(CountsAsCircuitBreakerFailure),
            });
        }

        if (sleepDurationProvider is not null && normalized.MaxRetryAttempts > 0)
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
    private static bool ShouldRetryOutboundResponse(HttpResponseMessage response) =>
        AzureRmAndRetailPricesHttpRetryPolicy.ShouldRetryHttpResponse(response);

    /// <summary>Failures that count toward the ratio-based breaker (includes 401/403 to avoid hammering bad credentials).</summary>
    private static bool CountsAsCircuitBreakerFailure(HttpResponseMessage response)
    {
        HttpStatusCode code = response.StatusCode;

        if (code == HttpStatusCode.Unauthorized || code == HttpStatusCode.Forbidden)
            return true;

        return ShouldRetryOutboundResponse(response);
    }
}
