using ArchLucid.Core.QuickScan;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Process-wide in-memory concurrency store for simulator/tests (TB-896).
///     Production-like hosts must use the SQL implementation — this is not shared across instances.
/// </summary>
public sealed class InMemoryQuickScanDistributedConcurrencyStore : IQuickScanDistributedConcurrencyStore
{
    private readonly object _sync = new();

    private readonly Dictionary<Guid, LeaseRow> _leases = new();

    private readonly Dictionary<Guid, QueueRow> _queue = new();

    /// <inheritdoc />
    public Task<QuickScanConcurrencyAdmitResult> TryAdmitAsync(
        QuickScanConcurrencyAdmitRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        lock (_sync)
        {
            ExpireStale(request.UtcNow);

            int activeLeases = CountActiveLeases(request.UtcNow);

            if (activeLeases < request.MaxConcurrentScans)
            {
                InsertLease(
                    request.LeaseId,
                    queueEntryId: null,
                    request.HolderInstanceId,
                    request.UtcNow,
                    request.LeaseDuration);

                return Task.FromResult(QuickScanConcurrencyAdmitResult.DirectLease(request.LeaseId));
            }

            if (request.MaxQueuedScans <= 0)
            {
                return Task.FromResult(QuickScanConcurrencyAdmitResult.Busy());
            }

            int waitingCount = CountWaitingQueueEntries(request.UtcNow);

            if (waitingCount >= request.MaxQueuedScans)
            {
                return Task.FromResult(QuickScanConcurrencyAdmitResult.QueueFull());
            }

            DateTimeOffset queueExpiresUtc = request.UtcNow + request.QueueWaitTimeout;

            _queue[request.QueueEntryId] = new QueueRow
            {
                QueueEntryId = request.QueueEntryId,
                RequestKey = request.RequestKey,
                EnqueuedUtc = request.UtcNow,
                QueueExpiresUtc = queueExpiresUtc,
                Status = QueueRowStatus.Waiting,
            };

            return Task.FromResult(QuickScanConcurrencyAdmitResult.Queued(request.QueueEntryId));
        }
    }

    /// <inheritdoc />
    public Task<QuickScanConcurrencyPromoteResult> TryPromoteAsync(
        QuickScanConcurrencyPromoteRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        lock (_sync)
        {
            ExpireStale(request.UtcNow);

            if (!_queue.TryGetValue(request.QueueEntryId, out QueueRow? row)
                || row.Status != QueueRowStatus.Waiting
                || row.QueueExpiresUtc <= request.UtcNow)
            {
                return Task.FromResult(QuickScanConcurrencyPromoteResult.NotYet());
            }

            int activeLeases = CountActiveLeases(request.UtcNow);

            if (activeLeases >= request.MaxConcurrentScans)
            {
                return Task.FromResult(QuickScanConcurrencyPromoteResult.NotYet());
            }

            InsertLease(
                request.LeaseId,
                request.QueueEntryId,
                request.HolderInstanceId,
                request.UtcNow,
                request.LeaseDuration);

            row.Status = QueueRowStatus.Promoted;

            return Task.FromResult(QuickScanConcurrencyPromoteResult.Success(request.LeaseId));
        }
    }

    /// <inheritdoc />
    public Task ReleaseLeaseAsync(Guid leaseId, CancellationToken cancellationToken = default)
    {
        lock (_sync)
        {
            if (_leases.TryGetValue(leaseId, out LeaseRow? row)
                && row.Status == LeaseRowStatus.Active)
            {
                row.Status = LeaseRowStatus.Released;
            }
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task AbandonQueueEntryAsync(Guid queueEntryId, CancellationToken cancellationToken = default)
    {
        lock (_sync)
        {
            if (_queue.TryGetValue(queueEntryId, out QueueRow? row)
                && row.Status == QueueRowStatus.Waiting)
            {
                row.Status = QueueRowStatus.Abandoned;
            }
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task RenewLeaseAsync(
        Guid leaseId,
        DateTimeOffset utcNow,
        TimeSpan leaseDuration,
        CancellationToken cancellationToken = default)
    {
        lock (_sync)
        {
            if (_leases.TryGetValue(leaseId, out LeaseRow? row)
                && row.Status == LeaseRowStatus.Active
                && row.ExpiresUtc > utcNow)
            {
                row.ExpiresUtc = utcNow + leaseDuration;
            }
        }

        return Task.CompletedTask;
    }

    private void ExpireStale(DateTimeOffset utcNow)
    {
        foreach (LeaseRow lease in _leases.Values)
        {
            if (lease.Status == LeaseRowStatus.Active && lease.ExpiresUtc <= utcNow)
            {
                lease.Status = LeaseRowStatus.Expired;
            }
        }

        foreach (QueueRow entry in _queue.Values)
        {
            if (entry.Status == QueueRowStatus.Waiting && entry.QueueExpiresUtc <= utcNow)
            {
                entry.Status = QueueRowStatus.TimedOut;
            }
        }
    }

    private int CountActiveLeases(DateTimeOffset utcNow) =>
        _leases.Values.Count(row => row.Status == LeaseRowStatus.Active && row.ExpiresUtc > utcNow);

    private int CountWaitingQueueEntries(DateTimeOffset utcNow) =>
        _queue.Values.Count(row => row.Status == QueueRowStatus.Waiting && row.QueueExpiresUtc > utcNow);

    private void InsertLease(
        Guid leaseId,
        Guid? queueEntryId,
        string holderInstanceId,
        DateTimeOffset utcNow,
        TimeSpan leaseDuration)
    {
        _leases[leaseId] = new LeaseRow
        {
            LeaseId = leaseId,
            QueueEntryId = queueEntryId,
            HolderInstanceId = holderInstanceId,
            AcquiredUtc = utcNow,
            ExpiresUtc = utcNow + leaseDuration,
            Status = LeaseRowStatus.Active,
        };
    }

    private sealed class LeaseRow
    {
        public required Guid LeaseId { get; init; }

        public Guid? QueueEntryId { get; init; }

        public required string HolderInstanceId { get; init; }

        public required DateTimeOffset AcquiredUtc { get; init; }

        public DateTimeOffset ExpiresUtc { get; set; }

        public LeaseRowStatus Status { get; set; }
    }

    private sealed class QueueRow
    {
        public required Guid QueueEntryId { get; init; }

        public required string RequestKey { get; init; }

        public required DateTimeOffset EnqueuedUtc { get; init; }

        public required DateTimeOffset QueueExpiresUtc { get; init; }

        public QueueRowStatus Status { get; set; }
    }

    private enum LeaseRowStatus
    {
        Active,
        Released,
        Expired,
    }

    private enum QueueRowStatus
    {
        Waiting,
        Promoted,
        Abandoned,
        TimedOut,
    }
}
