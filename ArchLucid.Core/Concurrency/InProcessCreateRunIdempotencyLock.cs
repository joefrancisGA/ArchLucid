namespace ArchLucid.Core.Concurrency;

/// <summary>
///     Single-process mutual exclusion for create-run idempotency (dev, tests, and InMemory storage hosts).
///     Production SQL uses a session-scoped <c>sp_getapplock</c> implementation registered in composition; both paths
///     complement <c>dbo.ArchitectureRunIdempotency</c> primary-key deduplication.
/// </summary>
public sealed class InProcessCreateRunIdempotencyLock : IDistributedCreateRunIdempotencyLock
{
    private readonly CreateRunIdempotencyProcessGateCache _gates;

    public InProcessCreateRunIdempotencyLock() : this(10_000, TimeSpan.FromMinutes(5))
    {
    }

    // Allows the eviction safety contract to be exercised without 10,000 keys or a five-minute delay.
    internal InProcessCreateRunIdempotencyLock(int capacity, TimeSpan idleTtl)
    {
        _gates = new CreateRunIdempotencyProcessGateCache(capacity, idleTtl);
    }

    internal int CachedGateCount => _gates.Count;

    /// <inheritdoc />
    public async Task<IAsyncDisposable> AcquireExclusiveSessionLockAsync(
        string lockResourceName,
        int lockTimeoutMs,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(lockResourceName);

        if (lockTimeoutMs < 0)
            throw new ArgumentOutOfRangeException(nameof(lockTimeoutMs));

        // Reserve BEFORE awaiting. A gate with an in-flight waiter (even one
        // not yet inside WaitAsync) must never be evicted and replaced.
        GateReservation reservation = _gates.Reserve(lockResourceName);

        try
        {
            int waitMs = lockTimeoutMs == 0 ? Timeout.Infinite : lockTimeoutMs;

            if (!await reservation.Gate.WaitAsync(waitMs, cancellationToken).ConfigureAwait(false))
                throw new TimeoutException(
                    $"In-process create-run idempotency lock timed out after {lockTimeoutMs}ms.");

            return new ReleaseScope(reservation);
        }
        catch
        {
            // Includes cancellation and timeout, so a failed waiter never
            // permanently pins an idle semaphore in the bounded cache.
            reservation.ReleaseReference();
            throw;
        }
    }

    private sealed class ReleaseScope(GateReservation reservation) : IAsyncDisposable
    {
        private int _disposed;

        public ValueTask DisposeAsync()
        {
            // IAsyncDisposable callers are not required to be single-use.
            // Releasing the semaphore twice would violate mutual exclusion.
            if (Interlocked.Exchange(ref _disposed, 1) == 0)
            {
                try
                {
                    reservation.Gate.Release();
                }
                finally
                {
                    reservation.ReleaseReference();
                }
            }

            return ValueTask.CompletedTask;
        }
    }

    private sealed class GateReservation(SemaphoreSlim gate, Action releaseReference)
    {
        private int _referenceReleased;

        public SemaphoreSlim Gate { get; } = gate;

        public void ReleaseReference()
        {
            if (Interlocked.Exchange(ref _referenceReleased, 1) == 0)
                releaseReference();
        }
    }

    /// <summary>
    ///     Bounded in-process semaphore map. Each reserve/release is synchronized
    ///     with eviction. References include BOTH current holders and waiters.
    /// </summary>
    private sealed class CreateRunIdempotencyProcessGateCache
    {
        private readonly int _capacity;
        private readonly Dictionary<string, Entry> _entries = new(StringComparer.Ordinal);
        private readonly TimeSpan _idleTtl;
        private readonly object _sync = new();

        public CreateRunIdempotencyProcessGateCache(int capacity, TimeSpan idleTtl)
        {
            _capacity = capacity > 0 ? capacity : 10_000;
            _idleTtl = idleTtl >= TimeSpan.Zero ? idleTtl : TimeSpan.FromMinutes(5);
        }

        public int Count
        {
            get
            {
                lock (_sync)
                    return _entries.Count;
            }
        }

        public GateReservation Reserve(string key)
        {
            lock (_sync)
            {
                long nowTicks = Environment.TickCount64;

                if (!_entries.TryGetValue(key, out Entry? entry))
                {
                    entry = new Entry(new SemaphoreSlim(1, 1), nowTicks);
                    _entries.Add(key, entry);
                }

                // A reservation is held from before WaitAsync until after
                // the corresponding acquired scope has released the gate.
                entry.References = checked(entry.References + 1);
                entry.LastUsedTicks = nowTicks;

                EvictIdleUnderPressure(nowTicks);

                Entry reservedEntry = entry;
                return new GateReservation(entry.Gate, () => ReleaseReference(key, reservedEntry));
            }
        }

        private void ReleaseReference(string key, Entry entry)
        {
            lock (_sync)
            {
                if (entry.References <= 0)
                    throw new InvalidOperationException("Unbalanced create-run gate reservation release.");

                entry.References--;
                if (entry.References == 0)
                    entry.LastUsedTicks = Environment.TickCount64;

                EvictIdleUnderPressure(Environment.TickCount64);
            }
        }

        private void EvictIdleUnderPressure(long nowTicks)
        {
            if (_entries.Count <= _capacity)
                return;

            long ttlMs = (long)_idleTtl.TotalMilliseconds;
            foreach (KeyValuePair<string, Entry> pair in _entries.ToArray())
            {
                if (_entries.Count <= _capacity)
                    break;

                Entry candidate = pair.Value;
                // CurrentCount alone does not account for a caller that has
                // obtained the semaphore but has not yet entered WaitAsync.
                if (candidate.References != 0 || candidate.Gate.CurrentCount != 1)
                    continue;

                if (nowTicks - candidate.LastUsedTicks < ttlMs)
                    continue;

                if (_entries.Remove(pair.Key))
                    candidate.Gate.Dispose();
            }
        }

        private sealed class Entry(SemaphoreSlim gate, long lastUsedTicks)
        {
            public int References;
            public long LastUsedTicks = lastUsedTicks;
            public SemaphoreSlim Gate { get; } = gate;
        }
    }
}
