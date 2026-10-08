using System.Diagnostics;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Hosting;
using ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.ExecuteOwnership;

/// <inheritdoc cref="IRunExecuteOwnershipLeaseService" />
public sealed class RunExecuteOwnershipLeaseService(
    IRunExecuteOwnershipLeaseRepository leaseRepository,
    IHostProcessInstanceId processInstanceId,
    IArchLucidStorageMode storageMode,
    IWorkerHostDrainGate drainGate,
    IOptionsMonitor<RunExecuteOwnershipLeaseOptions> optionsMonitor,
    ILogger<RunExecuteOwnershipLeaseService> logger,
    RunExecuteOwnershipActiveHolderRegistry activeHolders) : IRunExecuteOwnershipLeaseService
{
    private readonly IWorkerHostDrainGate _drainGate =
        drainGate ?? throw new ArgumentNullException(nameof(drainGate));

    private readonly IHostProcessInstanceId _processInstanceId =
        processInstanceId ?? throw new ArgumentNullException(nameof(processInstanceId));

    private readonly IRunExecuteOwnershipLeaseRepository _leaseRepository =
        leaseRepository ?? throw new ArgumentNullException(nameof(leaseRepository));

    private readonly ILogger<RunExecuteOwnershipLeaseService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IOptionsMonitor<RunExecuteOwnershipLeaseOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly IArchLucidStorageMode _storageMode =
        storageMode ?? throw new ArgumentNullException(nameof(storageMode));

    private readonly RunExecuteOwnershipActiveHolderRegistry _activeHolders =
        activeHolders ?? throw new ArgumentNullException(nameof(activeHolders));

    /// <inheritdoc />
    public bool IsEnabled => !_storageMode.IsInMemory && _optionsMonitor.CurrentValue.Enabled;

    /// <inheritdoc />
    public bool IsLocallyHoldingExecuteOwnership(Guid runId) => _activeHolders.Contains(runId);

    /// <inheritdoc />
    public async Task AcquireAsync(Guid runId, CancellationToken cancellationToken)
    {
        if (!IsEnabled)
            return;

        if (_drainGate.IsDraining)
        {
            throw new ConflictException(
                "Host is draining for shutdown; execute ownership is not admitting new leases. Retry on another replica after drain completes.");
        }

        RunExecuteOwnershipLeaseOptions options = _optionsMonitor.CurrentValue;
        int durationSeconds = Math.Clamp(options.LeaseDurationSeconds, 30, 3600);
        string holderInstanceId = _processInstanceId.Value;

        // Admit before SQL. A private dictionary on each scoped service let two requests
        // on one replica both renew the same holder id.
        if (!_activeHolders.TryAdmit(runId, holderInstanceId))
        {
            throw new ConflictException(
                $"Run '{runId:D}' execute is already in progress on this host instance. Wait for the in-flight execute to finish or retry on another replica.");
        }

        try
        {
            bool acquired = await _leaseRepository.TryAcquireOrRenewAsync(
                runId,
                holderInstanceId,
                durationSeconds,
                cancellationToken).ConfigureAwait(false);

            if (!acquired)
            {
                throw new ConflictException(
                    $"Run '{runId:D}' execute is already owned by another host instance. Retry after the ownership lease expires or reconcile stale ownership.");
            }

            if (_drainGate.IsDraining)
            {
                await _leaseRepository
                    .TryReleaseAsync(runId, holderInstanceId, cancellationToken)
                    .ConfigureAwait(false);

                throw new ConflictException(
                    "Host is draining for shutdown; execute ownership is not admitting new leases. Retry on another replica after drain completes.");
            }
        }
        catch
        {
            _activeHolders.TryRemove(runId);

            throw;
        }
    }

    /// <inheritdoc />
    public async Task RenewAsync(Guid runId, CancellationToken cancellationToken)
    {
        if (_storageMode.IsInMemory)
            return;

        if (!_activeHolders.Contains(runId))
            return;

        RunExecuteOwnershipLeaseOptions options = _optionsMonitor.CurrentValue;
        int durationSeconds = Math.Clamp(options.LeaseDurationSeconds, 30, 3600);

        string holderInstanceId = ResolveHolderInstanceId(runId);
        bool renewed = await _leaseRepository.TryAcquireOrRenewAsync(
            runId,
            holderInstanceId,
            durationSeconds,
            cancellationToken).ConfigureAwait(false);

        if (renewed)
            return;

        if (_logger.IsEnabled(LogLevel.Warning))
        {
            _logger.LogWarning(
                "Execute ownership lease renewal failed for RunId={RunId}; another holder may own the lease.",
                runId);
        }

        throw new ConflictException(
            $"Execute ownership lease renewal failed for run '{runId:D}'; another host instance may own this run.");
    }

    /// <inheritdoc />
    public IAsyncDisposable BeginRenewalScope(Guid runId, CancellationTokenSource executeCancellationSource)
    {
        if (_storageMode.IsInMemory)
            return NoOpRunExecuteOwnershipLeaseRenewalScope.Instance;

        ArgumentNullException.ThrowIfNull(executeCancellationSource);

        RunExecuteOwnershipLeaseRenewalScope? scope = RunExecuteOwnershipLeaseRenewalScope.TryBegin(
            this,
            _storageMode,
            _optionsMonitor,
            runId,
            executeCancellationSource,
            _logger);

        if (scope is not null)
            return scope;

        return NoOpRunExecuteOwnershipLeaseRenewalScope.Instance;
    }

    /// <inheritdoc />
    public async Task ReleaseAsync(Guid runId, CancellationToken cancellationToken)
    {
        if (_storageMode.IsInMemory)
            return;

        string holderInstanceId = ResolveHolderInstanceId(runId);

        await _leaseRepository.TryReleaseAsync(runId, holderInstanceId, cancellationToken).ConfigureAwait(false);

        _activeHolders.TryRemove(runId);
    }

    /// <inheritdoc />
    public async Task<int> ReleaseAllHeldByThisInstanceAsync(CancellationToken cancellationToken)
    {
        if (_storageMode.IsInMemory)
            return 0;

        Stopwatch stopwatch = Stopwatch.StartNew();

        HashSet<string> holderInstanceIds = new(_activeHolders.HolderInstanceIds, StringComparer.Ordinal);
        holderInstanceIds.Add(_processInstanceId.Value);

        int released = 0;
        foreach (string holderInstanceId in holderInstanceIds)
        {
            released += await _leaseRepository
                .ReleaseAllHeldByInstanceAsync(holderInstanceId, cancellationToken)
                .ConfigureAwait(false);
        }

        _activeHolders.Clear();

        stopwatch.Stop();
        ArchLucidInstrumentation.WorkerDrainLeaseReleaseDurationMilliseconds.Record(stopwatch.Elapsed.TotalMilliseconds);

        if (released > 0 && _logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Released {ReleasedCount} execute ownership lease(s) for instance {InstanceId} during shutdown drain.",
                released,
                _processInstanceId.Value);
        }

        return released;
    }

    private string ResolveHolderInstanceId(Guid runId)
    {
        if (_activeHolders.TryGetHolder(runId, out string? holderInstanceId) && holderInstanceId is not null)
            return holderInstanceId;

        return _processInstanceId.Value;
    }
}
