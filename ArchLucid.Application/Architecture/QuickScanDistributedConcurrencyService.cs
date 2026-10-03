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
        new QuickScanDistributedConcurrencyAdmitLimitRefreshStore(
            store ?? throw new ArgumentNullException(nameof(store)),
            safetyOptions ?? throw new ArgumentNullException(nameof(safetyOptions)),
            timeProvider ?? throw new ArgumentNullException(nameof(timeProvider)));

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
        QuickScanSafetyOperationalSnapshot operational =
            await _operationalStateProvider.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

        QuickScanSafetyOptions safety = _safetyOptions.CurrentValue;
        QuickScanSafetyEffectiveFeatureState effective = safety.ResolveEffectiveFeatureState();

        QuickScanDistributedConcurrencyAdmissionResult? emergencyReject =
            TryCreateEmergencyDisabledReject(effective, operational);

        if (emergencyReject is not null)
        {
            return emergencyReject;
        }

        Guid leaseId = Guid.NewGuid();
        Guid queueEntryId = Guid.NewGuid();

        QuickScanConcurrencyAdmitResult? admitResult = null;
        QuickScanConcurrencyAdmitResult? admittedResult = null;
        TimeSpan queueWaitTimeout;
        DateTimeOffset admitUtcNow;

        try
        {
            queueWaitTimeout = TimeSpan.FromSeconds(safety.Concurrency.QueueWaitTimeoutSeconds);
            admitUtcNow = _timeProvider.GetUtcNow();

            QuickScanConcurrencyAdmitRequest admitRequest = new()
            {
                LeaseId = leaseId,
                QueueEntryId = queueEntryId,
                RequestKey = requestKey,
                HolderInstanceId = HolderInstanceId,
                UtcNow = admitUtcNow,
                MaxConcurrentScans = safety.Concurrency.MaxConcurrentAnonymousScans,
                MaxQueuedScans = safety.Concurrency.MaxQueuedAnonymousScans,
                QueueWaitTimeout = queueWaitTimeout,
                LeaseDuration = TimeSpan.FromSeconds(safety.Concurrency.LeaseDurationSeconds),
            };

            admitResult = await _store.TryAdmitAsync(admitRequest, cancellationToken).ConfigureAwait(false);
            admittedResult = admitResult;

            emergencyReject = await TryCreateEmergencyDisabledRejectAfterAdmitAsync(
                admittedResult!,
                cancellationToken).ConfigureAwait(false);

            if (emergencyReject is not null)
            {
                return emergencyReject;
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Quick Scan distributed concurrency admit failed.");

            if (admitResult is not null)
                await CleanupAdmitResultAfterPostAdmitFailureAsync(admitResult).ConfigureAwait(false);

            return QuickScanDistributedConcurrencyAdmissionResult.Reject(
                QuickScanConcurrencyRejectionReason.StoreUnavailable);
        }

        QuickScanConcurrencyAdmitResult admitted = admittedResult!;

        QuickScanGuardContext telemetryContext = new()
        {
            ClientIp = string.Empty,
            SessionId = string.Empty,
            PayloadFingerprint = requestKey,
            UseDistributedConcurrencyLimit = true,
        };

        if (admitted.Outcome == QuickScanConcurrencyAdmitOutcome.DirectLease)
        {
            _telemetry.RecordConcurrencyLeaseAcquired(telemetryContext, queued: false);

            return QuickScanDistributedConcurrencyAdmissionResult.Permit(
                admitted.LeaseId!.Value,
                _store,
                _telemetry,
                telemetryContext,
                _safetyOptions,
                _timeProvider,
                cancellationToken);
        }

        if (admitted.Outcome == QuickScanConcurrencyAdmitOutcome.QueueFull)
        {
            _telemetry.RecordConcurrencyRejection(telemetryContext, QuickScanConcurrencyRejectionReason.QueueFull);

            return QuickScanDistributedConcurrencyAdmissionResult.Reject(
                QuickScanConcurrencyRejectionReason.QueueFull);
        }

        if (admitted.Outcome == QuickScanConcurrencyAdmitOutcome.Busy)
        {
            _telemetry.RecordConcurrencyRejection(telemetryContext, QuickScanConcurrencyRejectionReason.Busy);

            return QuickScanDistributedConcurrencyAdmissionResult.Reject(
                QuickScanConcurrencyRejectionReason.Busy);
        }

        _telemetry.RecordConcurrencyQueued(telemetryContext);

        DateTimeOffset deadline = admitUtcNow + queueWaitTimeout;
        TimeSpan pollInterval = TimeSpan.FromMilliseconds(250);
        Guid promotedLeaseId = Guid.NewGuid();
        Guid waitingQueueEntryId = admitted.QueueEntryId!.Value;

        try
        {
            while (_timeProvider.GetUtcNow() < deadline)
            {
                cancellationToken.ThrowIfCancellationRequested();

                QuickScanSafetyConcurrencyLimits promoteLimits = _safetyOptions.CurrentValue.Concurrency;

                QuickScanConcurrencyPromoteRequest promoteRequest = new()
                {
                    QueueEntryId = waitingQueueEntryId,
                    LeaseId = promotedLeaseId,
                    HolderInstanceId = HolderInstanceId,
                    UtcNow = _timeProvider.GetUtcNow(),
                    MaxConcurrentScans = promoteLimits.MaxConcurrentAnonymousScans,
                    LeaseDuration = TimeSpan.FromSeconds(promoteLimits.LeaseDurationSeconds),
                };

                QuickScanConcurrencyPromoteResult promoteResult;

                try
                {
                    promoteResult = await _store.TryPromoteAsync(promoteRequest, cancellationToken).ConfigureAwait(false);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    _logger.LogError(ex, "Quick Scan distributed concurrency promote failed.");

                    await AbandonQueueEntryForCleanupAsync(waitingQueueEntryId).ConfigureAwait(false);

                    return QuickScanDistributedConcurrencyAdmissionResult.Reject(
                        QuickScanConcurrencyRejectionReason.StoreUnavailable);
                }

                if (promoteResult.Promoted)
                {
                    emergencyReject = await TryCreateEmergencyDisabledRejectAfterPromoteAsync(
                        promoteResult,
                        waitingQueueEntryId,
                        cancellationToken).ConfigureAwait(false);

                    if (emergencyReject is not null)
                    {
                        return emergencyReject;
                    }

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
            await AbandonQueueEntryForCleanupAsync(waitingQueueEntryId).ConfigureAwait(false);

            throw;
        }

        await AbandonQueueEntryForCleanupAsync(waitingQueueEntryId).ConfigureAwait(false);

        _telemetry.RecordConcurrencyRejection(telemetryContext, QuickScanConcurrencyRejectionReason.QueueTimeout);

        return QuickScanDistributedConcurrencyAdmissionResult.Reject(
            QuickScanConcurrencyRejectionReason.QueueTimeout);
    }

    private async Task AbandonQueueEntryForCleanupAsync(Guid queueEntryId)
    {
        try
        {
            await _store.AbandonQueueEntryAsync(queueEntryId, CancellationToken.None).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Quick Scan distributed concurrency abandon failed; retrying once.");

            try
            {
                await _store.AbandonQueueEntryAsync(queueEntryId, CancellationToken.None).ConfigureAwait(false);
            }
            catch (Exception retryEx)
            {
                _logger.LogError(retryEx, "Quick Scan distributed concurrency abandon retry failed.");
            }
        }
    }

    private async Task CleanupAdmitResultAfterPostAdmitFailureAsync(QuickScanConcurrencyAdmitResult admitResult)
    {
        try
        {
            if (admitResult.Outcome == QuickScanConcurrencyAdmitOutcome.DirectLease && admitResult.LeaseId.HasValue)
            {
                await _store.ReleaseLeaseAsync(admitResult.LeaseId.Value, CancellationToken.None).ConfigureAwait(false);
            }
            else if (admitResult.Outcome == QuickScanConcurrencyAdmitOutcome.Queued && admitResult.QueueEntryId.HasValue)
            {
                await AbandonQueueEntryForCleanupAsync(admitResult.QueueEntryId.Value).ConfigureAwait(false);
            }
        }
        catch (Exception cleanupException)
        {
            _logger.LogError(cleanupException, "Quick Scan distributed concurrency post-admit cleanup failed.");
        }
    }

    private static QuickScanDistributedConcurrencyAdmissionResult? TryCreateEmergencyDisabledReject(
        QuickScanSafetyEffectiveFeatureState effective,
        QuickScanSafetyOperationalSnapshot operational)
    {
        if (!effective.Enabled || !effective.AnonymousExecutionEnabled
            || !operational.AnonymousExecutionAllowed)
        {
            return QuickScanDistributedConcurrencyAdmissionResult.Reject(
                QuickScanConcurrencyRejectionReason.EmergencyDisabled);
        }

        return null;
    }

    private async Task<QuickScanDistributedConcurrencyAdmissionResult?> TryCreateEmergencyDisabledRejectAfterAdmitAsync(
        QuickScanConcurrencyAdmitResult admitResult,
        CancellationToken cancellationToken)
    {
        QuickScanSafetyOperationalSnapshot operational =
            await _operationalStateProvider.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

        QuickScanSafetyOptions safety = _safetyOptions.CurrentValue;
        QuickScanSafetyEffectiveFeatureState effective = safety.ResolveEffectiveFeatureState();

        QuickScanDistributedConcurrencyAdmissionResult? emergencyReject =
            TryCreateEmergencyDisabledReject(effective, operational);

        if (emergencyReject is null)
        {
            return null;
        }

        if (admitResult.Outcome == QuickScanConcurrencyAdmitOutcome.DirectLease && admitResult.LeaseId.HasValue)
        {
            await _store.ReleaseLeaseAsync(admitResult.LeaseId.Value, CancellationToken.None).ConfigureAwait(false);
        }
        else if (admitResult.Outcome == QuickScanConcurrencyAdmitOutcome.Queued && admitResult.QueueEntryId.HasValue)
        {
            await AbandonQueueEntryForCleanupAsync(admitResult.QueueEntryId.Value).ConfigureAwait(false);
        }

        return emergencyReject;
    }

    private async Task<QuickScanDistributedConcurrencyAdmissionResult?> TryCreateEmergencyDisabledRejectAfterPromoteAsync(
        QuickScanConcurrencyPromoteResult promoteResult,
        Guid waitingQueueEntryId,
        CancellationToken cancellationToken)
    {
        QuickScanSafetyOperationalSnapshot operational =
            await _operationalStateProvider.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

        QuickScanSafetyOptions safety = _safetyOptions.CurrentValue;
        QuickScanSafetyEffectiveFeatureState effective = safety.ResolveEffectiveFeatureState();

        QuickScanDistributedConcurrencyAdmissionResult? emergencyReject =
            TryCreateEmergencyDisabledReject(effective, operational);

        if (emergencyReject is null)
        {
            return null;
        }

        if (promoteResult.LeaseId.HasValue)
        {
            await _store.ReleaseLeaseAsync(promoteResult.LeaseId.Value, CancellationToken.None).ConfigureAwait(false);
        }

        await AbandonQueueEntryForCleanupAsync(waitingQueueEntryId).ConfigureAwait(false);

        return emergencyReject;
    }
}
