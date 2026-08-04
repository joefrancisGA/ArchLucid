namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Shared leader-side outbox drain loop used by the outbox hosted services. Applies
///     <see cref="AdaptiveOutboxIdleBackoff" /> so bursts drain back-to-back and idle periods poll less.
/// </summary>
public static class AdaptiveOutboxDrainLoop
{
    public static async Task RunAsync(
        Func<CancellationToken, Task<int>> processPendingBatch,
        ILogger logger,
        string loopName,
        CancellationToken leaderToken)
    {
        ArgumentNullException.ThrowIfNull(processPendingBatch);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(loopName);

        AdaptiveOutboxIdleBackoff backoff = new();

        while (!leaderToken.IsCancellationRequested)
        {
            // A faulted poll counts as an idle poll so repeated failures back off instead of hot-looping.
            int dequeued = 0;

            try
            {
                dequeued = await processPendingBatch(leaderToken);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "{OutboxLoopName} host loop error.", loopName);
            }

            TimeSpan delay = backoff.NextDelay(dequeued);

            if (delay <= TimeSpan.Zero)
                continue;

            try
            {
                await Task.Delay(delay, leaderToken);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
