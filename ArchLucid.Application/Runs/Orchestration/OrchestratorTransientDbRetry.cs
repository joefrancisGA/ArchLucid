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
        if (TryGetParallelPersistInners(ex, out IReadOnlyCollection<Exception> inners) && inners.Count > 0)
            return inners.All(IsParallelPersistAggregateInnerRetriable);

        return SqlTransientDetector.IsTransient(ex);
    }

    /// <summary>
    ///     Top-level <see cref="AggregateException" /> inners may be repository wrappers that themselves carry a nested
    ///     parallel-persist aggregate; apply the same flattened all-inners-must-be-transient rule per inner.
    /// </summary>
    private static bool IsParallelPersistAggregateInnerRetriable(Exception inner)
    {
        if (TryGetParallelPersistInners(inner, out IReadOnlyCollection<Exception> nestedInners) && nestedInners.Count > 0)
            return nestedInners.All(IsParallelPersistAggregateInnerRetriable);

        return SqlTransientDetector.IsTransient(inner);
    }

    /// <summary>
    ///     Repository parallel persists surface <see cref="AggregateException" /> either at the root or inside a
    ///     wrapper such as <see cref="InvalidOperationException" />. Apply the same all-inners-must-be-transient rule
    ///     in both shapes so mixed permanent/transient aggregates fail fast regardless of inner ordering.
    /// </summary>
    private static bool TryGetParallelPersistInners(Exception ex, out IReadOnlyCollection<Exception> inners)
    {
        if (ex is AggregateException aggregate)
        {
            inners = aggregate.Flatten().InnerExceptions;

            return inners.Count > 0;
        }

        for (Exception? current = ex.InnerException; current is not null; current = current.InnerException)
        {
            if (current is not AggregateException nested)
                continue;

            inners = nested.Flatten().InnerExceptions;

            // Empty aggregate shells appear on some repository wrapper chains; skip them so a deeper mixed aggregate still fail-fasts.
            if (inners.Count > 0)
                return true;
        }

        inners = Array.Empty<Exception>();
        return false;
    }
}
