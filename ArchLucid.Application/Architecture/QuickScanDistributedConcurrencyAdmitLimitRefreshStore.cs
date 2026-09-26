using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Re-reads concurrency limits at <see cref="IQuickScanDistributedConcurrencyStore.TryAdmitAsync" />
///     so direct admits honor live <see cref="IOptionsMonitor{T}" /> changes (promote already re-reads each poll; #1542).
/// </summary>
internal sealed class QuickScanDistributedConcurrencyAdmitLimitRefreshStore(
    IQuickScanDistributedConcurrencyStore inner,
    IOptionsMonitor<QuickScanSafetyOptions> safetyOptions) : IQuickScanDistributedConcurrencyStore
{
    private readonly IQuickScanDistributedConcurrencyStore _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly IOptionsMonitor<QuickScanSafetyOptions> _safetyOptions =
        safetyOptions ?? throw new ArgumentNullException(nameof(safetyOptions));

    internal int? LastRefreshedMaxConcurrentScans { get; private set; }

    public Task<QuickScanConcurrencyAdmitResult> TryAdmitAsync(
        QuickScanConcurrencyAdmitRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        QuickScanSafetyConcurrencyLimits limits = _safetyOptions.CurrentValue.Concurrency;
        LastRefreshedMaxConcurrentScans = limits.MaxConcurrentAnonymousScans;

        QuickScanConcurrencyAdmitRequest refreshed = new()
        {
            LeaseId = request.LeaseId,
            QueueEntryId = request.QueueEntryId,
            RequestKey = request.RequestKey,
            HolderInstanceId = request.HolderInstanceId,
            UtcNow = request.UtcNow,
            QueueWaitTimeout = request.QueueWaitTimeout,
            MaxConcurrentScans = limits.MaxConcurrentAnonymousScans,
            MaxQueuedScans = limits.MaxQueuedAnonymousScans,
            LeaseDuration = TimeSpan.FromSeconds(limits.LeaseDurationSeconds),
        };

        return _inner.TryAdmitAsync(refreshed, cancellationToken);
    }

    public Task<QuickScanConcurrencyPromoteResult> TryPromoteAsync(
        QuickScanConcurrencyPromoteRequest request,
        CancellationToken cancellationToken = default) =>
        _inner.TryPromoteAsync(request, cancellationToken);

    public Task ReleaseLeaseAsync(Guid leaseId, CancellationToken cancellationToken = default) =>
        _inner.ReleaseLeaseAsync(leaseId, cancellationToken);

    public Task AbandonQueueEntryAsync(Guid queueEntryId, CancellationToken cancellationToken = default) =>
        _inner.AbandonQueueEntryAsync(queueEntryId, cancellationToken);

    public Task RenewLeaseAsync(
        Guid leaseId,
        DateTimeOffset utcNow,
        TimeSpan leaseDuration,
        CancellationToken cancellationToken = default) =>
        _inner.RenewLeaseAsync(leaseId, utcNow, leaseDuration, cancellationToken);
}
