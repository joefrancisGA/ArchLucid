using Polly;
using Polly.Retry;

using ArchLucid.Persistence.Connections;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Retries authority orchestrator state-persist and commit operations on transient SQL failures
///     (deadlock, timeout, etc.) without altering the state machine.
/// </summary>
public static class OrchestratorTransientDbRetry
{
    /// <summary>Three retries with 2s base exponential backoff (2s, 4s, 8s).</summary>
    private static readonly ResiliencePipeline Pipeline = BuildPipeline();

    public static async Task ExecuteAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken)
    {
        await Pipeline.ExecuteAsync(
            async ct =>
            {
                await action(ct).ConfigureAwait(false);
            },
            cancellationToken).ConfigureAwait(false);
    }

    public static async Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken) =>
        await Pipeline.ExecuteAsync(async ct => await action(ct).ConfigureAwait(false), cancellationToken).ConfigureAwait(false);

    private static ResiliencePipeline BuildPipeline()
    {
        const int maxRetryAttempts = 3;
        TimeSpan baseDelay = TimeSpan.FromSeconds(2);

        return new ResiliencePipelineBuilder()
            .AddRetry(new RetryStrategyOptions
            {
                MaxRetryAttempts = maxRetryAttempts,
                ShouldHandle = new PredicateBuilder().Handle<Exception>(IsRetriableOrchestratorDbFailure),
                DelayGenerator = args =>
                {
                    int retryAttempt = args.AttemptNumber + 1;
                    double baseMilliseconds = baseDelay.TotalMilliseconds * Math.Pow(2, retryAttempt - 1);
                    int jitterSpan = SqlOpenRetryDelayCalculator.ComputeJitterSpanMilliseconds(baseMilliseconds);
                    int jitterOffsetMs = jitterSpan == 0 ? 0 : Random.Shared.Next(-jitterSpan, jitterSpan + 1);
                    TimeSpan retryDelay = SqlOpenRetryDelayCalculator.Calculate(
                        retryAttempt,
                        baseDelay,
                        jitterOffsetMs);

                    return new ValueTask<TimeSpan?>(retryDelay);
                }
            })
            .Build();
    }

    /// <summary>
    ///     Parallel persistence paths can surface <see cref="AggregateException" /> with multiple SQL failures;
    ///     flatten before applying <see cref="SqlTransientDetector" /> so a later deadlock is not masked by an
    ///     earlier non-transient inner.
    /// </summary>
    private static bool IsRetriableOrchestratorDbFailure(Exception ex)
    {
        if (ex is AggregateException aggregate)
        {
            foreach (Exception inner in aggregate.Flatten().InnerExceptions)
            {
                if (SqlTransientDetector.IsTransient(inner))
                    return true;
            }

            return false;
        }

        return SqlTransientDetector.IsTransient(ex);
    }
}
