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
    /// <param name="logger">Optional; retry attempts log at Warning using this logger's category.</param>
    public static ResiliencePipeline BuildSqlOpenRetryPipeline(
        ILogger? logger = null,
        int maxRetryAttempts = 3,
        TimeSpan? baseDelay = null,
        Func<long>? getElapsedMillisecondsSinceOpenStarted = null) =>
        BuildSqlTransientRetryPipeline(
            logger,
            maxRetryAttempts,
            baseDelay,
            getElapsedMillisecondsSinceOpenStarted,
            operationPhase: "connection open");

    /// <summary>
    ///     Same policy as <see cref="BuildSqlOpenRetryPipeline" /> for full SQL operations (open + Dapper/commands).
    /// </summary>
    public static ResiliencePipeline BuildSqlOperationRetryPipeline(
        ILogger? logger = null,
        int maxRetryAttempts = 3,
        TimeSpan? baseDelay = null,
        Func<long>? getElapsedMillisecondsSinceOperationStarted = null) =>
        BuildSqlTransientRetryPipeline(
            logger,
            maxRetryAttempts,
            baseDelay,
            getElapsedMillisecondsSinceOperationStarted,
            operationPhase: "SQL operation");

    private static ResiliencePipeline BuildSqlTransientRetryPipeline(
        ILogger? logger,
        int maxRetryAttempts,
        TimeSpan? baseDelay,
        Func<long>? getElapsedMilliseconds,
        string operationPhase)
    {
        // Polly.Retry.RetryStrategyOptions.MaxRetryAttempts must be >= 1; callers use 0 to mean "no retries".
        if (maxRetryAttempts <= 0)
            return new ResiliencePipelineBuilder().Build();

        TimeSpan delay = baseDelay ?? TimeSpan.FromMilliseconds(200);

        return new ResiliencePipelineBuilder()
            .AddRetry(new RetryStrategyOptions
            {
                MaxRetryAttempts = maxRetryAttempts,
                ShouldHandle = new PredicateBuilder().Handle<Exception>(SqlTransientDetector.IsTransient),
                DelayGenerator = args =>
                {
                    int retryAttempt = args.AttemptNumber + 1;
                    double baseMilliseconds = delay.TotalMilliseconds * Math.Pow(2, retryAttempt - 1);
                    int jitterSpan = SqlOpenRetryDelayCalculator.ComputeJitterSpanMilliseconds(baseMilliseconds);
                    int jitterOffsetMs = jitterSpan == 0 ? 0 : Random.Shared.Next(-jitterSpan, jitterSpan + 1);
                    TimeSpan retryDelay = SqlOpenRetryDelayCalculator.Calculate(
                        retryAttempt,
                        delay,
                        jitterOffsetMs);

                    return new ValueTask<TimeSpan?>(retryDelay);
                },
                OnRetry = args =>
                {
                    if (logger is null)
                        return ValueTask.CompletedTask;

                    long elapsedMs = getElapsedMilliseconds?.Invoke() ?? 0;

                    if (args.Outcome.Exception is not { } ex)
                        return ValueTask.CompletedTask;

                    logger.LogWarning(
                        ex,
                        "Transient SQL error on {OperationPhase} after {ElapsedMs}ms; scheduling retry {RetryAttempt} (max attempts {MaxRetryAttempts}).",
                        operationPhase,
                        elapsedMs,
                        args.AttemptNumber,
                        maxRetryAttempts);

                    return ValueTask.CompletedTask;
                }
            })
            .Build();
    }
}
