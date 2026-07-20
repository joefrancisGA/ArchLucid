namespace ArchLucid.Core.QuickScan;

/// <summary>Distributed anonymous Quick Scan concurrency leases and bounded queue (TB-896).</summary>
public interface IQuickScanDistributedConcurrencyStore
{
    Task<QuickScanConcurrencyAdmitResult> TryAdmitAsync(
        QuickScanConcurrencyAdmitRequest request,
        CancellationToken cancellationToken = default);

    Task<QuickScanConcurrencyPromoteResult> TryPromoteAsync(
        QuickScanConcurrencyPromoteRequest request,
        CancellationToken cancellationToken = default);

    Task ReleaseLeaseAsync(Guid leaseId, CancellationToken cancellationToken = default);

    Task AbandonQueueEntryAsync(Guid queueEntryId, CancellationToken cancellationToken = default);

    Task RenewLeaseAsync(
        Guid leaseId,
        DateTimeOffset utcNow,
        TimeSpan leaseDuration,
        CancellationToken cancellationToken = default);
}

/// <summary>Admission attempt for a single anonymous Quick Scan request.</summary>
public sealed class QuickScanConcurrencyAdmitRequest
{
    public required Guid LeaseId { get; init; }

    public required Guid QueueEntryId { get; init; }

    public required string RequestKey { get; init; }

    public required string HolderInstanceId { get; init; }

    public required DateTimeOffset UtcNow { get; init; }

    public required int MaxConcurrentScans { get; init; }

    public required int MaxQueuedScans { get; init; }

    public required TimeSpan QueueWaitTimeout { get; init; }

    public required TimeSpan LeaseDuration { get; init; }
}

/// <summary>Queue promotion attempt after waiting for a concurrency slot.</summary>
public sealed class QuickScanConcurrencyPromoteRequest
{
    public required Guid QueueEntryId { get; init; }

    public required Guid LeaseId { get; init; }

    public required string HolderInstanceId { get; init; }

    public required DateTimeOffset UtcNow { get; init; }

    public required int MaxConcurrentScans { get; init; }

    public required TimeSpan LeaseDuration { get; init; }
}

/// <summary>Admission outcome from <see cref="IQuickScanDistributedConcurrencyStore.TryAdmitAsync" />.</summary>
public sealed class QuickScanConcurrencyAdmitResult
{
    private QuickScanConcurrencyAdmitResult(
        QuickScanConcurrencyAdmitOutcome outcome,
        Guid? leaseId,
        Guid? queueEntryId)
    {
        Outcome = outcome;
        LeaseId = leaseId;
        QueueEntryId = queueEntryId;
    }

    public QuickScanConcurrencyAdmitOutcome Outcome { get; }

    public Guid? LeaseId { get; }

    public Guid? QueueEntryId { get; }

    public static QuickScanConcurrencyAdmitResult DirectLease(Guid leaseId) =>
        new(QuickScanConcurrencyAdmitOutcome.DirectLease, leaseId, null);

    public static QuickScanConcurrencyAdmitResult Queued(Guid queueEntryId) =>
        new(QuickScanConcurrencyAdmitOutcome.Queued, null, queueEntryId);

    public static QuickScanConcurrencyAdmitResult QueueFull() =>
        new(QuickScanConcurrencyAdmitOutcome.QueueFull, null, null);

    public static QuickScanConcurrencyAdmitResult Busy() =>
        new(QuickScanConcurrencyAdmitOutcome.Busy, null, null);
}

/// <summary>Promotion outcome from <see cref="IQuickScanDistributedConcurrencyStore.TryPromoteAsync" />.</summary>
public sealed class QuickScanConcurrencyPromoteResult
{
    private QuickScanConcurrencyPromoteResult(bool promoted, Guid? leaseId)
    {
        Promoted = promoted;
        LeaseId = leaseId;
    }

    public bool Promoted { get; }

    public Guid? LeaseId { get; }

    public static QuickScanConcurrencyPromoteResult Success(Guid leaseId) => new(true, leaseId);

    public static QuickScanConcurrencyPromoteResult NotYet() => new(false, null);
}

/// <summary>Admission paths for anonymous Quick Scan execution slots.</summary>
public enum QuickScanConcurrencyAdmitOutcome
{
    DirectLease,
    Queued,
    QueueFull,
    Busy,
}
