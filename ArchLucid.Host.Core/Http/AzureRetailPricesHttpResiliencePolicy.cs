using System.Net;

using Microsoft.Extensions.Logging;

using Polly;
using Polly.CircuitBreaker;
using Polly.Retry;

namespace ArchLucid.Host.Core.Http;

/// <summary>
///     Retry and a circuit breaker for read-only public cloud pricing clients.
/// </summary>
public static class AzureRetailPricesHttpResiliencePolicy
{
    /// <summary>Retries after the first attempt (four total executions when transient failures occupy the first three responses).</summary>
    public const int MaxRetryAttempts = 3;

    /// <summary>Minimum failed logical calls needed to open the circuit within the sampling window.</summary>
    public const int CircuitBreakerFailureThreshold = 5;

    /// <summary>Maximum in-flight logical calls per named pricing client.</summary>
    internal const int MaxConcurrentPricingCalls = 50;

    /// <summary>Duration the circuit remains open before a trial call is allowed.</summary>
    public const int CircuitBreakerBreakDurationSeconds = 30;

    /// <summary>Uses exponential backoff (~2<sup>n</sup> seconds) between retry attempts.</summary>
    public static IAsyncPolicy<HttpResponseMessage> Create(ILogger logger) =>
        Create(logger, DeadlineAwareReadRetryTiming.GetExponentialDelay);

    /// <summary>
    ///     Identical fault handling as the single-parameter overload; inject zero-delay backoff for deterministic tests.
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> Create(ILogger logger, Func<int, TimeSpan> sleepDurationProvider) =>
        Build(logger, sleepDurationProvider, timing: null);

    /// <summary>
    ///     Compatibility alias for the deadline-aware public pricing policy.
    ///     The caller should use the same budget for <see cref="HttpClient.Timeout" /> to bound requests in flight.
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> CreateForAzureRetailPrices(
        ILogger logger,
        TimeSpan callBudget,
        TimeProvider? timeProvider = null) =>
        CreateForPublicPricing(logger, callBudget, timeProvider);

    /// <summary>
    ///     Honors Retry-After on 429 and 503 responses when the delay fits the remaining call budget.
    ///     Use the same budget for <see cref="HttpClient.Timeout" /> to bound the HTTP request.
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> CreateForPublicPricing(
        ILogger logger,
        TimeSpan callBudget,
        TimeProvider? timeProvider = null)
    {
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(callBudget, TimeSpan.Zero);

        return Build(
            logger,
            DeadlineAwareReadRetryTiming.GetExponentialDelay,
            new DeadlineAwareReadRetryTiming(timeProvider ?? TimeProvider.System, callBudget, MaxRetryAttempts));
    }

    private static IAsyncPolicy<HttpResponseMessage> Build(
        ILogger logger,
        Func<int, TimeSpan> sleepDurationProvider,
        DeadlineAwareReadRetryTiming? timing)
    {
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(sleepDurationProvider);

        ResiliencePipelineBuilder<HttpResponseMessage> builder = new();

        if (timing is not null)
        {
            builder.TimeProvider = timing.Clock;
            // Reject local saturation outside the breaker and retry so it is not counted as a provider failure.
            builder.AddStrategy(static _ => new PricingCapacityGate());
            builder.AddStrategy(_ => timing);
        }

        RetryStrategyOptions<HttpResponseMessage> retry = timing?.CreateRetryOptions(logger) ?? new()
        {
            MaxRetryAttempts = MaxRetryAttempts,
            ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                .Handle<HttpRequestException>()
                .HandleResult(AzureRmAndRetailPricesHttpRetryPolicy.ShouldRetryHttpResponse),
            DelayGenerator = args => new ValueTask<TimeSpan?>(sleepDurationProvider(args.AttemptNumber)),
            OnRetry = args =>
            {
                AzureRmAndRetailPricesHttpRetryPolicy.TryLogRetry(logger, args);

                return ValueTask.CompletedTask;
            },
        };

        // The outer breaker samples only the final outcome of each logical call.
        ResiliencePipeline<HttpResponseMessage> pipeline = builder
            .AddCircuitBreaker(new CircuitBreakerStrategyOptions<HttpResponseMessage>
            {
                FailureRatio = 1.0,
                MinimumThroughput = CircuitBreakerFailureThreshold,
                SamplingDuration = TimeSpan.FromMinutes(1),
                BreakDuration = TimeSpan.FromSeconds(CircuitBreakerBreakDurationSeconds),
                ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                    .Handle<HttpRequestException>()
                    .HandleResult(CountsAsCircuitBreakerFailure),
            })
            .AddRetry(retry)
            .Build();

        return pipeline.AsAsyncPolicy();
    }

    // Catalog circuit breakers and retries use the same transient HTTP status classification.
    private static bool CountsAsCircuitBreakerFailure(HttpResponseMessage response) =>
        AzureRmAndRetailPricesHttpRetryPolicy.ShouldRetryHttpResponse(response);

    private sealed class PricingCapacityGate : ResilienceStrategy<HttpResponseMessage>
    {
        private int _activeCalls;

        protected override async ValueTask<Outcome<HttpResponseMessage>> ExecuteCore<TState>(
            Func<ResilienceContext, TState, ValueTask<Outcome<HttpResponseMessage>>> callback,
            ResilienceContext context,
            TState state)
        {
            context.CancellationToken.ThrowIfCancellationRequested();
            int activeCalls = Interlocked.Increment(ref _activeCalls);

            try
            {
                if (activeCalls > MaxConcurrentPricingCalls)
                {
                    return Outcome.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
                    {
                        ReasonPhrase = "Local pricing client concurrency limit reached",
                    });
                }

                return await callback(context, state).ConfigureAwait(false);
            }
            finally
            {
                Interlocked.Decrement(ref _activeCalls);
            }
        }
    }
}
