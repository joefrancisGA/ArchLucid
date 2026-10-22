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
    private readonly CancellationTokenSource? _executeCancellationSource;
    private readonly Task? _renewalTask;
    private Guid? _leaseId;
    private bool _released;
    private bool _renewalStopped;

    private QuickScanDistributedConcurrencyAdmissionResult(
        bool allowed,
        QuickScanConcurrencyRejectionReason? rejectionReason,
        Guid? leaseId,
        IQuickScanDistributedConcurrencyStore? store,
        IQuickScanTelemetry? telemetry,
        QuickScanGuardContext? telemetryContext,
        CancellationTokenSource? executeCancellationSource,
        Task? renewalTask)
    {
        Allowed = allowed;
        RejectionReason = rejectionReason;
        _leaseId = leaseId;
        _store = store;
        _telemetry = telemetry;
        _telemetryContext = telemetryContext;
        _executeCancellationSource = executeCancellationSource;
        _renewalTask = renewalTask;
    }

    public bool Allowed { get; }

    public QuickScanConcurrencyRejectionReason? RejectionReason { get; }

    public Guid? LeaseId => _leaseId;

    /// <summary>Linked execute token cancelled when distributed lease renewal fails.</summary>
    public CancellationToken ExecutionCancellationToken =>
        _executeCancellationSource?.Token ?? CancellationToken.None;

    public static QuickScanDistributedConcurrencyAdmissionResult Permit(
        Guid leaseId,
        IQuickScanDistributedConcurrencyStore store,
        IQuickScanTelemetry telemetry,
        QuickScanGuardContext telemetryContext,
        IOptionsMonitor<QuickScanSafetyOptions> safetyOptions,
        TimeProvider timeProvider,
        CancellationToken executionCancellationToken)
    {
        CancellationTokenSource executeCancellationSource =
            CancellationTokenSource.CreateLinkedTokenSource(executionCancellationToken);

        Task renewalTask = QuickScanDistributedConcurrencyLeaseRenewal.RunLoopAsync(
            leaseId,
            store,
            safetyOptions,
            timeProvider,
            executeCancellationSource);

        return new QuickScanDistributedConcurrencyAdmissionResult(
            true,
            null,
            leaseId,
            store,
            telemetry,
            telemetryContext,
            executeCancellationSource,
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
        await StopRenewalLoopAsync().ConfigureAwait(false);

        if (_released || !_leaseId.HasValue || _store is null)
        {
            return;
        }

        await _store.ReleaseLeaseAsync(_leaseId.Value, CancellationToken.None).ConfigureAwait(false);

        _released = true;

        if (_telemetry is not null && _telemetryContext is not null)
        {
            _telemetry.RecordConcurrencyLeaseReleased(_telemetryContext);
        }
    }

    private async Task StopRenewalLoopAsync()
    {
        if (_renewalStopped || _executeCancellationSource is null)
        {
            return;
        }

        _renewalStopped = true;

        if (!_executeCancellationSource.IsCancellationRequested)
        {
            await _executeCancellationSource.CancelAsync().ConfigureAwait(false);
        }

        if (_renewalTask is not null)
        {
            try
            {
                await _renewalTask.ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
            }
            catch (Exception)
            {
                // Renewal can stop when the store rejects RenewLeaseAsync; release must still run.
            }
        }

        _executeCancellationSource.Dispose();
    }
}
