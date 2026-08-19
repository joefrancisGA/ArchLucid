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
    ILogger<RunExecuteOwnershipLeaseService> logger) : IRunExecuteOwnershipLeaseService
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

    /// <inheritdoc />
    public bool IsEnabled => !_storageMode.IsInMemory && _optionsMonitor.CurrentValue.Enabled;

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
        bool acquired = await _leaseRepository.TryAcquireOrRenewAsync(
            runId,
            _processInstanceId.Value,
            durationSeconds,
            cancellationToken).ConfigureAwait(false);

        if (acquired)
            return;

        throw new ConflictException(
            $"Run '{runId:D}' execute is already owned by another host instance. Retry after the ownership lease expires or reconcile stale ownership.");
    }

    /// <inheritdoc />
    public Task ReleaseAsync(Guid runId, CancellationToken cancellationToken)
    {
        if (!IsEnabled)
            return Task.CompletedTask;

        return _leaseRepository.TryReleaseAsync(runId, _processInstanceId.Value, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<int> ReleaseAllHeldByThisInstanceAsync(CancellationToken cancellationToken)
    {
        if (!IsEnabled)
            return 0;

        Stopwatch stopwatch = Stopwatch.StartNew();

        int released = await _leaseRepository
            .ReleaseAllHeldByInstanceAsync(_processInstanceId.Value, cancellationToken)
            .ConfigureAwait(false);

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
}
