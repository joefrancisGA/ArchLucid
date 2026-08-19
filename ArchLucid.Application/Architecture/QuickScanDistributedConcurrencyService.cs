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

        Task renewalTask = RunLeaseRenewalLoopAsync(
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

    private static async Task RunLeaseRenewalLoopAsync(
        Guid leaseId,
        IQuickScanDistributedConcurrencyStore store,
        IOptionsMonitor<QuickScanSafetyOptions> safetyOptions,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        QuickScanSafetyConcurrencyLimits limits = safetyOptions.CurrentValue.Concurrency;
        TimeSpan renewalInterval = TimeSpan.FromSeconds(limits.LeaseRenewalIntervalSeconds);
        TimeSpan leaseDuration = TimeSpan.FromSeconds(limits.LeaseDurationSeconds);

        using PeriodicTimer timer = new(renewalInterval);

        try
        {
            while (await timer.WaitForNextTickAsync(cancellationToken).ConfigureAwait(false))
            {
                await store.RenewLeaseAsync(
                    leaseId,
                    timeProvider.GetUtcNow(),
                    leaseDuration,
                    cancellationToken).ConfigureAwait(false);
            }
        }
        catch (OperationCanceledException)
        {
        }
    }
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
