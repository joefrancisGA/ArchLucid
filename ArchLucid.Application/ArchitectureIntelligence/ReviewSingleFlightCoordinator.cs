using System.Collections.Concurrent;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Per-key in-process single-flight for one in-flight map.
/// </summary>
internal sealed class ReviewSingleFlightCoordinator
{
    private readonly ConcurrentDictionary<string, InFlightEntry> _inFlight = new(StringComparer.Ordinal);

    public async Task<ClosedLoopReasoningResult> CoalesceAsync(
        string key,
        Func<CancellationToken, Task<ClosedLoopReasoningResult>> leaderWork,
        CancellationToken cancellationToken,
        bool stripCoalescedFollowerPublishLeaks = false)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);
        ArgumentNullException.ThrowIfNull(leaderWork);

        while (true)
        {
            cancellationToken.ThrowIfCancellationRequested();

            InFlightEntry entry = new()
            {
                Completion = new TaskCompletionSource<ClosedLoopReasoningResult>(
                    TaskCreationOptions.RunContinuationsAsynchronously),
            };

            if (_inFlight.TryAdd(key, entry))
            {
                try
                {
                    ClosedLoopReasoningResult result = await leaderWork(cancellationToken).ConfigureAwait(false);
                    ClosedLoopReasoningResult waitersResult = ClosedLoopReasoningResultCloner.Clone(result);
                    entry.Completion.TrySetResult(waitersResult);

                    return ClosedLoopReasoningResultCloner.Clone(result);
                }
                catch (OperationCanceledException)
                {
                    entry.Completion.TrySetException(new ReviewCacheSingleFlightLeaderAbortedException());

                    throw;
                }
                catch (Exception exception)
                {
                    entry.Completion.TrySetException(exception);

                    throw;
                }
                finally
                {
                    _inFlight.TryRemove(new KeyValuePair<string, InFlightEntry>(key, entry));
                }
            }

            if (!_inFlight.TryGetValue(key, out InFlightEntry? existing))
                continue;

            try
            {
                ClosedLoopReasoningResult waitersResult =
                    await existing.Completion.Task.WaitAsync(cancellationToken).ConfigureAwait(false);

                ClosedLoopReasoningResult followerClone = ClosedLoopReasoningResultCloner.Clone(waitersResult);

                if (stripCoalescedFollowerPublishLeaks
                    && (waitersResult.PublishBlocked || waitersResult.PublishedToProduct))
                    ClosedLoopCacheHitPublishGuard.ClearCoalescedFollowerPublishLeaks(followerClone);

                return followerClone;
            }
            catch (Exception exception) when (IsLeaderAborted(exception))
            {
                continue;
            }
        }
    }

    private static bool IsLeaderAborted(Exception exception)
    {
        if (exception is ReviewCacheSingleFlightLeaderAbortedException)
            return true;

        if (exception is AggregateException aggregate)
        {
            return aggregate.Flatten().InnerExceptions.Any(IsLeaderAborted);
        }

        return exception.InnerException is not null && IsLeaderAborted(exception.InnerException);
    }

    private sealed class InFlightEntry
    {
        public required TaskCompletionSource<ClosedLoopReasoningResult> Completion
        {
            get;
            init;
        }
    }
}
