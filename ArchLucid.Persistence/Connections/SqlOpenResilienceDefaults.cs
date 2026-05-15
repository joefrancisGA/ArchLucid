using Microsoft.Extensions.Logging;

using Polly;
using Polly.Retry;

namespace ArchLucid.Persistence.Connections;

/// <summary>Builds <see cref="ResiliencePipeline" /> instances for SQL connection open retries (transient errors only).</summary>
public static class SqlOpenResilienceDefaults
{
    /// <summary>
    ///     Matches the historical <see cref="ResilientSqlConnectionFactory" /> defaults: 3 attempts, 200 ms base
    ///     exponential backoff with jitter.
    /// </summary>
    public static ResiliencePipeline BuildSqlOpenRetryPipeline(
        ILogger<ResilientSqlConnectionFactory>? logger = null,
        int maxRetryAttempts = 3,
        TimeSpan? baseDelay = null,
        Func<long>? getElapsedMillisecondsSinceOpenStarted = null)
    {
        // Polly.Retry.RetryStrategyOptions.MaxRetryAttempts must be >= 1; callers use 0 to mean "no retries".
        if (maxRetryAttempts <= 0)
            return new ResiliencePipelineBuilder().Build();

        TimeSpan delay = baseDelay ?? TimeSpan.FromMilliseconds(200);

        return new ResiliencePipelineBuilder()
            .AddRetry(new RetryStrategyOptions
            {
                MaxRetryAttempts = maxRetryAttempts,
                Delay = delay,
                BackoffType = DelayBackoffType.Exponential,
                UseJitter = true,
                ShouldHandle = new PredicateBuilder().Handle<Exception>(SqlTransientDetector.IsTransient),
                OnRetry = args =>
                {
                    if (logger is null)
                        return ValueTask.CompletedTask;

                    long elapsedMs = getElapsedMillisecondsSinceOpenStarted?.Invoke() ?? 0;

                    if (args.Outcome.Exception is not { } ex)
                        return ValueTask.CompletedTask;

                    logger.LogWarning(
                        ex,
                        "Transient SQL error on connection open after {ElapsedMs}ms; scheduling retry {RetryAttempt} (max attempts {MaxRetryAttempts}).",
                        elapsedMs,
                        args.AttemptNumber,
                        maxRetryAttempts);

                    return ValueTask.CompletedTask;
                }
            })
            .Build();
    }
}
