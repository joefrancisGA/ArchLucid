using System.Collections.Concurrent;

namespace ArchLucid.Core.Concurrency;

/// <summary>
///     Single-process mutual exclusion for create-run idempotency (dev, tests, and InMemory storage hosts).
///     Production SQL uses a session-scoped <c>sp_getapplock</c> implementation registered in composition; both paths
///     complement <c>dbo.ArchitectureRunIdempotency</c> primary-key deduplication.
/// </summary>
public sealed class InProcessCreateRunIdempotencyLock : IDistributedCreateRunIdempotencyLock
{
    private readonly CreateRunIdempotencyProcessGateCache _gates = new();

    /// <inheritdoc />
    public async Task<IAsyncDisposable> AcquireExclusiveSessionLockAsync(
        string lockResourceName,
        int lockTimeoutMs,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(lockResourceName);

        if (lockTimeoutMs < 0)
            throw new ArgumentOutOfRangeException(nameof(lockTimeoutMs));

        SemaphoreSlim gate = _gates.GetOrAddGate(lockResourceName);

        int waitMs = lockTimeoutMs == 0 ? Timeout.Infinite : lockTimeoutMs;

        if (!await gate.WaitAsync(waitMs, cancellationToken).ConfigureAwait(false))
            throw new TimeoutException(
                $"In-process create-run idempotency lock timed out after {lockTimeoutMs}ms.");

        return new ReleaseScope(gate, lockResourceName, _gates);
    }

    private sealed class ReleaseScope(
        SemaphoreSlim gate,
        string releasedKey,
        CreateRunIdempotencyProcessGateCache cache) : IAsyncDisposable
    {
        public ValueTask DisposeAsync()
        {
            gate.Release();
            cache.TryEvictAfterRelease(releasedKey);

            return ValueTask.CompletedTask;
        }
    }

    /// <summary>
    ///     Bounded in-process <see cref="SemaphoreSlim" /> map (evicts idle entries under pressure).
    /// </summary>
    private sealed class CreateRunIdempotencyProcessGateCache
    {
        private readonly int _capacity;
        private readonly ConcurrentDictionary<string, Entry> _entries = new(StringComparer.Ordinal);
        private readonly TimeSpan _idleTtl;

        public CreateRunIdempotencyProcessGateCache(int capacity = 10_000, TimeSpan? idleTtl = null)
        {
            _capacity = capacity > 0 ? capacity : 10_000;
            _idleTtl = idleTtl ?? TimeSpan.FromMinutes(5);
        }

        public SemaphoreSlim GetOrAddGate(string key)
        {
            long ticks = Environment.TickCount64;

            Entry entry = _entries.AddOrUpdate(
                key,
                _ => new Entry(new SemaphoreSlim(1, 1), ticks),
                (_, existing) =>
                {
                    existing.LastUsedTicks = ticks;

                    return existing;
                });

            return entry.Gate;
        }

        public void TryEvictAfterRelease(string releasedKey)
        {
            if (_entries.Count <= _capacity)
                return;

            long nowTicks = Environment.TickCount64;
            long ttlMs = (long)_idleTtl.TotalMilliseconds;

            foreach (KeyValuePair<string, Entry> pair in _entries)
            {
                if (_entries.Count <= _capacity)
                    break;

                Entry e = pair.Value;

                if (pair.Key == releasedKey)
                    continue;

                if (e.Gate.CurrentCount == 0)
                    continue;

                if (nowTicks - e.LastUsedTicks > ttlMs
                    && _entries.TryRemove(pair.Key, out Entry? removed))

                    removed.Gate.Dispose();
            }
        }

        private sealed class Entry(SemaphoreSlim gate, long lastUsedTicks)
        {
            public long LastUsedTicks = lastUsedTicks;

            public SemaphoreSlim Gate { get; } = gate;
        }
    }
}
