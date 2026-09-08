using ArchLucid.Contracts.Common;

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
        IOptionsMonitor<RunExecuteOwnershipLeaseOptions> optionsMonitor,
        Guid runId,
        CancellationTokenSource executeCancellationSource,
        ILogger logger)
    {
        if (!leaseService.IsEnabled)
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
            using PeriodicTimer timer = new(TimeSpan.FromSeconds(renewIntervalSeconds));

            do
            {
                await _leaseService.RenewAsync(_runId, cancellationToken).ConfigureAwait(false);
            }
            while (await timer.WaitForNextTickAsync(cancellationToken).ConfigureAwait(false));
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
        }
        catch (ConflictException)
        {
            _executeCancellationSource.Cancel();
        }
        catch (Exception ex) when (_logger.IsEnabled(LogLevel.Warning))
        {
            _logger.LogWarning(
                ex,
                "Execute ownership lease renewal loop stopped unexpectedly for RunId={RunId}.",
                _runId);
        }
    }
}
