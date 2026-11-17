using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.ExecuteOwnership;

/// <summary>
///     Background lease renewal for long-running <c>ExecuteRunAsync</c> batches (TB-943 / DR-06).
/// </summary>
public sealed class RunExecuteOwnershipLeaseRenewalScope : IAsyncDisposable
{
    private readonly CancellationTokenSource _executeCancellationSource;
    private readonly CancellationTokenSource _loopCancellationSource;
    private readonly IRunExecuteOwnershipLeaseService _leaseService;
    private readonly ILogger _logger;
    private readonly Guid _runId;
    private readonly Task _renewalTask;

    private RunExecuteOwnershipLeaseRenewalScope(
        IRunExecuteOwnershipLeaseService leaseService,
        Guid runId,
        int renewIntervalSeconds,
        CancellationTokenSource executeCancellationSource,
        ILogger logger)
    {
        _leaseService = leaseService;
        _runId = runId;
        _logger = logger;
        _executeCancellationSource = executeCancellationSource;
        _loopCancellationSource = CancellationTokenSource.CreateLinkedTokenSource(executeCancellationSource.Token);
        _renewalTask = RunRenewalLoopAsync(renewIntervalSeconds, _loopCancellationSource.Token);
    }

    public static RunExecuteOwnershipLeaseRenewalScope? TryBegin(
        IRunExecuteOwnershipLeaseService leaseService,
        IArchLucidStorageMode storageMode,
        IOptionsMonitor<RunExecuteOwnershipLeaseOptions> optionsMonitor,
        Guid runId,
        CancellationTokenSource executeCancellationSource,
        ILogger logger)
    {
        if (storageMode.IsInMemory)
            return null;

        ArgumentNullException.ThrowIfNull(executeCancellationSource);

        RunExecuteOwnershipLeaseOptions options = optionsMonitor.CurrentValue;
        int leaseDurationSeconds = Math.Clamp(options.LeaseDurationSeconds, 30, 3600);
        int renewIntervalSeconds = Math.Clamp(
            options.HeartbeatRenewIntervalSeconds > 0
                ? options.HeartbeatRenewIntervalSeconds
                : leaseDurationSeconds / 3,
            15,
            leaseDurationSeconds - 1);

        return new RunExecuteOwnershipLeaseRenewalScope(
            leaseService,
            runId,
            renewIntervalSeconds,
            executeCancellationSource,
            logger);
    }

    public async ValueTask DisposeAsync()
    {
        await _loopCancellationSource.CancelAsync().ConfigureAwait(false);

        try
        {
            await _renewalTask.ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
        }

        _loopCancellationSource.Dispose();
    }

    private async Task RunRenewalLoopAsync(int renewIntervalSeconds, CancellationToken cancellationToken)
    {
        try
        {
            do
            {
                if (!_leaseService.IsLocallyHoldingExecuteOwnership(_runId))
                {
                    _executeCancellationSource.Cancel();

                    return;
                }

                await _leaseService.RenewAsync(_runId, cancellationToken).ConfigureAwait(false);

                if (!_leaseService.IsLocallyHoldingExecuteOwnership(_runId))
                {
                    _executeCancellationSource.Cancel();

                    return;
                }
            }
            while (await DelayUntilNextRenewOrAdmissionLostAsync(renewIntervalSeconds, cancellationToken)
                .ConfigureAwait(false));
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
        }
        catch (ConflictException)
        {
            _executeCancellationSource.Cancel();
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Execute ownership lease renewal loop stopped for RunId={RunId}; cancelling in-flight execute.",
                    _runId);
            }

            _executeCancellationSource.Cancel();
        }
    }

    private async Task<bool> DelayUntilNextRenewOrAdmissionLostAsync(
        int renewIntervalSeconds,
        CancellationToken cancellationToken)
    {
        TimeSpan pollInterval = TimeSpan.FromSeconds(1);
        DateTimeOffset deadline = TimeProvider.System.GetUtcNow().AddSeconds(renewIntervalSeconds);

        while (true)
        {
            if (!_leaseService.IsLocallyHoldingExecuteOwnership(_runId))
            {
                _executeCancellationSource.Cancel();

                return false;
            }

            TimeSpan remaining = deadline - TimeProvider.System.GetUtcNow();

            if (remaining <= TimeSpan.Zero)
                return true;

            TimeSpan delay = remaining < pollInterval ? remaining : pollInterval;

            await Task.Delay(delay, cancellationToken).ConfigureAwait(false);
        }
    }
}
