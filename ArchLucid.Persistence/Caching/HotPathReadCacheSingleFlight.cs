using System.Collections.Concurrent;

using ArchLucid.Core.Diagnostics;

namespace ArchLucid.Persistence.Caching;

/// <summary>
///     Per-key in-process single-flight so concurrent hybrid-cache misses share one loader (TB-2160).
/// </summary>
internal static class HotPathReadCacheSingleFlight
{
    private sealed class InFlightEntry
    {
        public required TaskCompletionSource<object?> Completion
        {
            get;
            init;
        }
    }

    private static readonly ConcurrentDictionary<string, InFlightEntry> InFlight =
        new(StringComparer.Ordinal);

    public static async Task<T> CoalesceAsync<T>(
        string key,
        Func<CancellationToken, Task<T>> leaderWork,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);
        ArgumentNullException.ThrowIfNull(leaderWork);

        while (true)
        {
            InFlightEntry entry = new()
            {
                Completion = new TaskCompletionSource<object?>(TaskCreationOptions.RunContinuationsAsynchronously),
            };

            if (InFlight.TryAdd(key, entry))
            {
                try
                {
                    T result = await leaderWork(cancellationToken).ConfigureAwait(false);
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

            ArchLucidInstrumentation.RecordHotPathReadCacheInFlightDedupe();

            object? boxed = await existing.Completion.Task.WaitAsync(cancellationToken).ConfigureAwait(false);

            return (T)boxed!;
        }
    }
}
