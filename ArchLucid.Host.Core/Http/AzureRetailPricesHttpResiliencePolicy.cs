using System.Net;
using System.Net.Http.Headers;

using Microsoft.Extensions.Logging;

using Polly;
using Polly.CircuitBreaker;
using Polly.Retry;

namespace ArchLucid.Host.Core.Http;

/// <summary>
///     Retry plus consecutive-failure circuit breaker for the public Azure Retail Prices HTTP client.
/// </summary>
public static class AzureRetailPricesHttpResiliencePolicy
{
    /// <summary>Retries after the first attempt (four total executions when transient failures occupy the first three responses).</summary>
    public const int MaxRetryAttempts = 3;

    /// <summary>Opens the circuit after this many handled failures within the sampling window.</summary>
    public const int CircuitBreakerFailureThreshold = 5;

    /// <summary>Duration the circuit remains open before a trial call is allowed.</summary>
    public const int CircuitBreakerBreakDurationSeconds = 30;

    /// <summary>Uses exponential backoff (~2<sup>n</sup> seconds) between retry attempts.</summary>
    public static IAsyncPolicy<HttpResponseMessage> Create(ILogger logger) =>
        Create(logger, GetExponentialDelay);

    /// <summary>
    ///     Identical fault handling as the single-parameter overload; inject zero-delay backoff for deterministic tests.
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> Create(ILogger logger, Func<int, TimeSpan> sleepDurationProvider) =>
        Build(logger, sleepDurationProvider, timing: null);

    /// <summary>
    ///     Uses Retry-After on 429 and 503 responses from the read-only Azure catalog when another attempt fits the call budget.
    ///     The caller should use the same budget for <see cref="HttpClient.Timeout" /> to bound requests in flight.
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> CreateForAzureRetailPrices(
        ILogger logger,
        TimeSpan callBudget,
        TimeProvider? timeProvider = null)
    {
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(callBudget, TimeSpan.Zero);

        return Build(logger, GetExponentialDelay, new DeadlineAwareRetryTiming(timeProvider ?? TimeProvider.System, callBudget));
    }

    private static IAsyncPolicy<HttpResponseMessage> Build(
        ILogger logger,
        Func<int, TimeSpan> sleepDurationProvider,
        DeadlineAwareRetryTiming? timing)
    {
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(sleepDurationProvider);

        // Retry wraps the breaker, so each attempt reaches it. Preserve the existing attempt-based threshold.
        const int attemptsPerLogicalCall = MaxRetryAttempts + 1;

        ResiliencePipelineBuilder<HttpResponseMessage> builder = new();
        Func<RetryPredicateArguments<HttpResponseMessage>, ValueTask<bool>> shouldHandle =
            new PredicateBuilder<HttpResponseMessage>()
                .Handle<HttpRequestException>()
                .HandleResult(AzureRmAndRetailPricesHttpRetryPolicy.ShouldRetryHttpResponse);

        if (timing is not null)
        {
            builder.TimeProvider = timing.Clock;
            builder.AddStrategy(_ => timing);
            shouldHandle = timing.PlanRetry;
        }

        ResiliencePipeline<HttpResponseMessage> pipeline = builder
            .AddRetry(new RetryStrategyOptions<HttpResponseMessage>
            {
                MaxRetryAttempts = MaxRetryAttempts,
                ShouldHandle = shouldHandle,
                DelayGenerator = args => new ValueTask<TimeSpan?>(
                    timing is null ? sleepDurationProvider(args.AttemptNumber) : DeadlineAwareRetryTiming.GetPlannedDelay(args.Context)),
                OnRetry = args =>
                {
                    AzureRmAndRetailPricesHttpRetryPolicy.TryLogRetry(logger, args);

                    return ValueTask.CompletedTask;
                },
            })
            .AddCircuitBreaker(new CircuitBreakerStrategyOptions<HttpResponseMessage>
            {
                FailureRatio = 1.0,
                MinimumThroughput = CircuitBreakerFailureThreshold * attemptsPerLogicalCall,
                SamplingDuration = TimeSpan.FromMinutes(1),
                BreakDuration = TimeSpan.FromSeconds(CircuitBreakerBreakDurationSeconds),
                ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                    .Handle<HttpRequestException>()
                    .HandleResult(CountsAsCircuitBreakerFailure),
            })
            .Build();

        return pipeline.AsAsyncPolicy();
    }

    // Keep circuit-breaker failure classification aligned with the shared
    // outbound retry policy rather than maintaining a second status allowlist.
    private static bool CountsAsCircuitBreakerFailure(HttpResponseMessage response) =>
        AzureRmAndRetailPricesHttpRetryPolicy.ShouldRetryHttpResponse(response);

    private static TimeSpan GetExponentialDelay(int attempt) =>
        TimeSpan.FromSeconds(Math.Pow(2, attempt));

    // Store timing on the execution context so concurrent requests through the shared policy have independent budgets.
    private sealed class DeadlineAwareRetryTiming(TimeProvider clock, TimeSpan callBudget) : ResilienceStrategy<HttpResponseMessage>
    {
        private static readonly ResiliencePropertyKey<long> StartedAt = new("AzureRetailPrices.CallStartedAt");
        private static readonly ResiliencePropertyKey<TimeSpan> PlannedDelay = new("AzureRetailPrices.NextRetryDelay");

        public TimeProvider Clock => clock;

        public static TimeSpan GetPlannedDelay(ResilienceContext context) =>
            context.Properties.GetValue(PlannedDelay, TimeSpan.Zero);

        public ValueTask<bool> PlanRetry(RetryPredicateArguments<HttpResponseMessage> args)
        {
            HttpResponseMessage? response = args.Outcome.Result;

            if (args.AttemptNumber >= MaxRetryAttempts ||
                (args.Outcome.Exception is not HttpRequestException &&
                 (response is null || !AzureRmAndRetailPricesHttpRetryPolicy.ShouldRetryHttpResponse(response))))
            {
                return new ValueTask<bool>(false);
            }

            TimeSpan delay = GetExponentialDelay(args.AttemptNumber);

            if (response?.StatusCode is HttpStatusCode.TooManyRequests or HttpStatusCode.ServiceUnavailable &&
                response.Headers.RetryAfter is { } retryAfter)
            {
                TimeSpan serverDelay = ResolveServerDelay(retryAfter);
                delay = serverDelay > delay ? serverDelay : delay;
            }

            long start = args.Context.Properties.GetValue(StartedAt, 0L);
            TimeSpan remaining = callBudget - clock.GetElapsedTime(start);

            if (delay >= remaining)
            {
                // Returning false leaves the last response intact for the caller.
                return new ValueTask<bool>(false);
            }

            args.Context.Properties.Set(PlannedDelay, delay);
            return new ValueTask<bool>(true);
        }

        protected override ValueTask<Outcome<HttpResponseMessage>> ExecuteCore<TState>(
            Func<ResilienceContext, TState, ValueTask<Outcome<HttpResponseMessage>>> callback,
            ResilienceContext context,
            TState state)
        {
            context.Properties.Set(StartedAt, clock.GetTimestamp());
            return callback(context, state);
        }

        private TimeSpan ResolveServerDelay(RetryConditionHeaderValue retryAfter) =>
            retryAfter.Delta ?? (retryAfter.Date is { } retryAt ? retryAt - clock.GetUtcNow() : TimeSpan.Zero);
    }
}
