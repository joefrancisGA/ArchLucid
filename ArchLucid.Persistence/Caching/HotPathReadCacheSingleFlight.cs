using System.Collections.Concurrent;

using ArchLucid.Core.Diagnostics;

namespace ArchLucid.Persistence.Caching;

/// <summary>
///     Per-cache single-flight so concurrent misses for a key share one loader (TB-2160).
/// </summary>
internal sealed class HotPathReadCacheSingleFlight
{
    private sealed class InFlightEntry
    {
        public required CancellationToken LeaderCancellationToken
        {
            get;
            init;
        }

        public required TaskCompletionSource<object?> Completion
        {
            get;
            init;
        }
    }

    private readonly ConcurrentDictionary<string, InFlightEntry> _inFlight =
        new(StringComparer.Ordinal);

    public async Task<T> CoalesceAsync<T>(
        string key,
        Func<CancellationToken, Task<T>> leaderWork,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);
        ArgumentNullException.ThrowIfNull(leaderWork);

        while (true)
        {
            cancellationToken.ThrowIfCancellationRequested();
            InFlightEntry entry = new()
            {
                LeaderCancellationToken = cancellationToken,
                Completion = new TaskCompletionSource<object?>(TaskCreationOptions.RunContinuationsAsynchronously),
            };

            if (_inFlight.TryAdd(key, entry))
            {
                try
                {
                    T result = await leaderWork(cancellationToken).ConfigureAwait(false);
                    entry.Completion.TrySetResult(result);

                    return result;
                }
                catch (OperationCanceledException operationCanceledException)
                {
                    // Clear the flight before waking followers that can retry.
                    _inFlight.TryRemove(new KeyValuePair<string, InFlightEntry>(key, entry));
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
                    _inFlight.TryRemove(new KeyValuePair<string, InFlightEntry>(key, entry));
                }
            }

            if (!_inFlight.TryGetValue(key, out InFlightEntry? existing))
                continue;

            ArchLucidInstrumentation.RecordHotPathReadCacheInFlightDedupe();

            try
            {
                object? boxed = await existing.Completion.Task.WaitAsync(cancellationToken).ConfigureAwait(false);
                return (T)boxed!;
            }
            catch (OperationCanceledException) when (
                !cancellationToken.IsCancellationRequested
                && existing.LeaderCancellationToken.IsCancellationRequested
                && existing.Completion.Task.IsCanceled)
            {
                // A cancelled leader must not cancel an independent reader.
            }
        }
    }
}
