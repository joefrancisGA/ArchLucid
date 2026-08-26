using System.Collections.Concurrent;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Per-key in-process single-flight so concurrent review-cache misses share one live closed-loop run.
/// </summary>
internal static class ReviewResultCacheSingleFlight
{
    private sealed class InFlightEntry
    {
        public required TaskCompletionSource<ClosedLoopReasoningResult> Completion
        {
            get;
            init;
        }
    }

    private static readonly ConcurrentDictionary<string, InFlightEntry> InFlight =
        new(StringComparer.Ordinal);

    public static async Task<ClosedLoopReasoningResult> CoalesceAsync(
        string key,
        Func<CancellationToken, Task<ClosedLoopReasoningResult>> leaderWork,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);
        ArgumentNullException.ThrowIfNull(leaderWork);

        while (true)
        {
            InFlightEntry entry = new()
            {
                Completion = new TaskCompletionSource<ClosedLoopReasoningResult>(
                    TaskCreationOptions.RunContinuationsAsynchronously),
            };

            if (InFlight.TryAdd(key, entry))
            {
                try
                {
                    ClosedLoopReasoningResult result = await leaderWork(cancellationToken).ConfigureAwait(false);
                    entry.Completion.TrySetResult(result);

                    return result;
                }
                catch (OperationCanceledException operationCanceledException)
                {
                    entry.Completion.TrySetCanceled(operationCanceledException.CancellationToken);

                    throw;
                }
                catch (Exception exception)
                {
                    entry.Completion.TrySetException(exception);

                    throw;
                }
                finally
                {
                    InFlight.TryRemove(new KeyValuePair<string, InFlightEntry>(key, entry));
                }
            }

            if (!InFlight.TryGetValue(key, out InFlightEntry? existing))
                continue;

            return await existing.Completion.Task.WaitAsync(cancellationToken).ConfigureAwait(false);
        }
    }
}
