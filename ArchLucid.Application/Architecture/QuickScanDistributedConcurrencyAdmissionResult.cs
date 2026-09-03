using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Architecture;

/// <summary>Admission outcome including a releasable lease when permitted.</summary>
public sealed class QuickScanDistributedConcurrencyAdmissionResult : IAsyncDisposable
{
    private readonly IQuickScanDistributedConcurrencyStore? _store;
    private readonly IQuickScanTelemetry? _telemetry;
    private readonly QuickScanGuardContext? _telemetryContext;
    private readonly CancellationTokenSource? _renewalCancellation;
    private readonly Task? _renewalTask;
    private Guid? _leaseId;
    private bool _released;

    private QuickScanDistributedConcurrencyAdmissionResult(
        bool allowed,
        QuickScanConcurrencyRejectionReason? rejectionReason,
        Guid? leaseId,
        IQuickScanDistributedConcurrencyStore? store,
        IQuickScanTelemetry? telemetry,
        QuickScanGuardContext? telemetryContext,
        CancellationTokenSource? renewalCancellation,
        Task? renewalTask)
    {
        Allowed = allowed;
        RejectionReason = rejectionReason;
        _leaseId = leaseId;
        _store = store;
        _telemetry = telemetry;
        _telemetryContext = telemetryContext;
        _renewalCancellation = renewalCancellation;
        _renewalTask = renewalTask;
    }

    public bool Allowed { get; }

    public QuickScanConcurrencyRejectionReason? RejectionReason { get; }

    public Guid? LeaseId => _leaseId;

    public static QuickScanDistributedConcurrencyAdmissionResult Permit(
        Guid leaseId,
        IQuickScanDistributedConcurrencyStore store,
        IQuickScanTelemetry telemetry,
        QuickScanGuardContext telemetryContext,
        IOptionsMonitor<QuickScanSafetyOptions> safetyOptions,
        TimeProvider timeProvider,
        CancellationToken executionCancellationToken)
    {
        CancellationTokenSource renewalCancellation = CancellationTokenSource.CreateLinkedTokenSource(executionCancellationToken);

        Task renewalTask = QuickScanDistributedConcurrencyLeaseRenewal.RunLoopAsync(
            leaseId,
            store,
            safetyOptions,
            timeProvider,
            renewalCancellation.Token);

        return new QuickScanDistributedConcurrencyAdmissionResult(
            true,
            null,
            leaseId,
            store,
            telemetry,
            telemetryContext,
            renewalCancellation,
            renewalTask);
    }

    public static QuickScanDistributedConcurrencyAdmissionResult Reject(
        QuickScanConcurrencyRejectionReason reason) =>
        new(false, reason, null, null, null, null, null, null);

    public static QuickScanDistributedConcurrencyAdmissionResult NoOp() =>
        new(true, null, null, null, null, null, null, null);

    /// <inheritdoc />
    public async ValueTask DisposeAsync()
    {
        if (_renewalCancellation is not null)
        {
            await _renewalCancellation.CancelAsync().ConfigureAwait(false);

            if (_renewalTask is not null)
            {
                try
                {
                    await _renewalTask.ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                }
            }

            _renewalCancellation.Dispose();
        }

        if (_released || !_leaseId.HasValue || _store is null)
        {
            return;
        }

        _released = true;

        await _store.ReleaseLeaseAsync(_leaseId.Value).ConfigureAwait(false);

        if (_telemetry is not null && _telemetryContext is not null)
        {
            _telemetry.RecordConcurrencyLeaseReleased(_telemetryContext);
        }
    }
}
