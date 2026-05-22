using System.Net;

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
        Create(logger, static attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)));

    /// <summary>
    ///     Identical fault handling as the single-parameter overload; inject zero-delay backoff for deterministic tests.
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> Create(ILogger logger, Func<int, TimeSpan> sleepDurationProvider)
    {
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(sleepDurationProvider);

        ResiliencePipeline<HttpResponseMessage> pipeline = new ResiliencePipelineBuilder<HttpResponseMessage>()
            .AddRetry(new RetryStrategyOptions<HttpResponseMessage>
            {
                MaxRetryAttempts = MaxRetryAttempts,
                ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                    .Handle<HttpRequestException>()
                    .HandleResult(AzureRmAndRetailPricesHttpRetryPolicy.ShouldRetryHttpResponse),
                DelayGenerator = args =>
                {
                    TimeSpan delay = sleepDurationProvider(args.AttemptNumber);

                    return new ValueTask<TimeSpan?>(delay);
                },
                OnRetry = args =>
                {
                    AzureRmAndRetailPricesHttpRetryPolicy.TryLogRetry(logger, args);

                    return ValueTask.CompletedTask;
                },
            })
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
            .Build();

        return pipeline.AsAsyncPolicy();
    }

    private static bool CountsAsCircuitBreakerFailure(HttpResponseMessage response)
    {
        HttpStatusCode code = response.StatusCode;

        if (code == HttpStatusCode.RequestTimeout)
            return true;

        if (code == HttpStatusCode.TooManyRequests)
            return true;

        return (int)code >= 500 && (int)code <= 599;
    }
}
