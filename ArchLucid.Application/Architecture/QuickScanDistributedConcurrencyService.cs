using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Architecture;

/// <summary>Waits for a distributed anonymous Quick Scan execution slot (TB-896).</summary>
public interface IQuickScanDistributedConcurrencyService
{
    Task<QuickScanDistributedConcurrencyAdmissionResult> WaitForAdmissionAsync(
        string requestKey,
        CancellationToken cancellationToken = default);
}

/// <inheritdoc cref="IQuickScanDistributedConcurrencyService" />
public sealed class QuickScanDistributedConcurrencyService(
    IOptionsMonitor<QuickScanSafetyOptions> safetyOptions,
    IQuickScanDistributedConcurrencyStore store,
    IQuickScanTelemetry telemetry,
    IQuickScanSafetyOperationalStateProvider operationalStateProvider,
    TimeProvider timeProvider,
    ILogger<QuickScanDistributedConcurrencyService> logger) : IQuickScanDistributedConcurrencyService
{
    private static readonly string HolderInstanceId = Environment.MachineName;

    private readonly IOptionsMonitor<QuickScanSafetyOptions> _safetyOptions =
        safetyOptions ?? throw new ArgumentNullException(nameof(safetyOptions));

    private readonly IQuickScanDistributedConcurrencyStore _store =
        store ?? throw new ArgumentNullException(nameof(store));

    private readonly IQuickScanTelemetry _telemetry =
        telemetry ?? throw new ArgumentNullException(nameof(telemetry));

    private readonly IQuickScanSafetyOperationalStateProvider _operationalStateProvider =
        operationalStateProvider ?? throw new ArgumentNullException(nameof(operationalStateProvider));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly ILogger<QuickScanDistributedConcurrencyService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<QuickScanDistributedConcurrencyAdmissionResult> WaitForAdmissionAsync(
        string requestKey,
        CancellationToken cancellationToken = default)
    {
        QuickScanSafetyOptions safety = _safetyOptions.CurrentValue;
        QuickScanSafetyEffectiveFeatureState effective = safety.ResolveEffectiveFeatureState();

        QuickScanSafetyOperationalSnapshot operational =
            await _operationalStateProvider.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

        if (!effective.Enabled || !effective.AnonymousExecutionEnabled
            || !operational.AnonymousExecutionAllowed)
        {
            return QuickScanDistributedConcurrencyAdmissionResult.Reject(
                QuickScanConcurrencyRejectionReason.EmergencyDisabled);
        }

        QuickScanSafetyConcurrencyLimits limits = safety.Concurrency;
        DateTimeOffset utcNow = _timeProvider.GetUtcNow();
        TimeSpan queueWaitTimeout = TimeSpan.FromSeconds(limits.QueueWaitTimeoutSeconds);
        TimeSpan leaseDuration = TimeSpan.FromSeconds(limits.LeaseDurationSeconds);
        Guid leaseId = Guid.NewGuid();
        Guid queueEntryId = Guid.NewGuid();

        QuickScanConcurrencyAdmitRequest admitRequest = new()
        {
            LeaseId = leaseId,
            QueueEntryId = queueEntryId,
            RequestKey = requestKey,
            HolderInstanceId = HolderInstanceId,
            UtcNow = utcNow,
            MaxConcurrentScans = limits.MaxConcurrentAnonymousScans,
            MaxQueuedScans = limits.MaxQueuedAnonymousScans,
            QueueWaitTimeout = queueWaitTimeout,
            LeaseDuration = leaseDuration,
        };

        QuickScanConcurrencyAdmitResult admitResult;

        try
        {
            admitResult = await _store.TryAdmitAsync(admitRequest, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Quick Scan distributed concurrency admit failed.");

            return QuickScanDistributedConcurrencyAdmissionResult.Reject(
                QuickScanConcurrencyRejectionReason.StoreUnavailable);
        }

        QuickScanGuardContext telemetryContext = new()
        {
            ClientIp = string.Empty,
            SessionId = string.Empty,
            PayloadFingerprint = requestKey,
            UseDistributedConcurrencyLimit = true,
        };

        if (admitResult.Outcome == QuickScanConcurrencyAdmitOutcome.DirectLease)
        {
            _telemetry.RecordConcurrencyLeaseAcquired(telemetryContext, queued: false);

            return QuickScanDistributedConcurrencyAdmissionResult.Permit(
                admitResult.LeaseId!.Value,
                _store,
                _telemetry,
                telemetryContext,
                _safetyOptions,
                _timeProvider,
                cancellationToken);
        }

        if (admitResult.Outcome == QuickScanConcurrencyAdmitOutcome.QueueFull)
        {
            _telemetry.RecordConcurrencyRejection(telemetryContext, QuickScanConcurrencyRejectionReason.QueueFull);

            return QuickScanDistributedConcurrencyAdmissionResult.Reject(
                QuickScanConcurrencyRejectionReason.QueueFull);
        }

        if (admitResult.Outcome == QuickScanConcurrencyAdmitOutcome.Busy)
        {
            _telemetry.RecordConcurrencyRejection(telemetryContext, QuickScanConcurrencyRejectionReason.Busy);

            return QuickScanDistributedConcurrencyAdmissionResult.Reject(
                QuickScanConcurrencyRejectionReason.Busy);
        }

        _telemetry.RecordConcurrencyQueued(telemetryContext);

        DateTimeOffset deadline = utcNow + queueWaitTimeout;
        TimeSpan pollInterval = TimeSpan.FromMilliseconds(250);
        Guid promotedLeaseId = Guid.NewGuid();
        Guid waitingQueueEntryId = admitResult.QueueEntryId!.Value;

        try
        {
            while (_timeProvider.GetUtcNow() < deadline)
            {
                cancellationToken.ThrowIfCancellationRequested();

                QuickScanConcurrencyPromoteRequest promoteRequest = new()
                {
                    QueueEntryId = waitingQueueEntryId,
                    LeaseId = promotedLeaseId,
                    HolderInstanceId = HolderInstanceId,
                    UtcNow = _timeProvider.GetUtcNow(),
                    MaxConcurrentScans = limits.MaxConcurrentAnonymousScans,
                    LeaseDuration = leaseDuration,
                };

                QuickScanConcurrencyPromoteResult promoteResult;

                try
                {
                    promoteResult = await _store.TryPromoteAsync(promoteRequest, cancellationToken).ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Quick Scan distributed concurrency promote failed.");

                    await _store.AbandonQueueEntryAsync(waitingQueueEntryId, cancellationToken).ConfigureAwait(false);

                    return QuickScanDistributedConcurrencyAdmissionResult.Reject(
                        QuickScanConcurrencyRejectionReason.StoreUnavailable);
                }

                if (promoteResult.Promoted)
                {
                    _telemetry.RecordConcurrencyLeaseAcquired(telemetryContext, queued: true);

                    return QuickScanDistributedConcurrencyAdmissionResult.Permit(
                        promoteResult.LeaseId!.Value,
                        _store,
                        _telemetry,
                        telemetryContext,
                        _safetyOptions,
                        _timeProvider,
                        cancellationToken);
                }

                await Task.Delay(pollInterval, cancellationToken).ConfigureAwait(false);
            }
        }
        catch (OperationCanceledException)
        {
            await _store.AbandonQueueEntryAsync(waitingQueueEntryId, CancellationToken.None).ConfigureAwait(false);

            throw;
        }

        await _store.AbandonQueueEntryAsync(waitingQueueEntryId, cancellationToken).ConfigureAwait(false);

        _telemetry.RecordConcurrencyRejection(telemetryContext, QuickScanConcurrencyRejectionReason.QueueTimeout);

        return QuickScanDistributedConcurrencyAdmissionResult.Reject(
            QuickScanConcurrencyRejectionReason.QueueTimeout);
    }
}
