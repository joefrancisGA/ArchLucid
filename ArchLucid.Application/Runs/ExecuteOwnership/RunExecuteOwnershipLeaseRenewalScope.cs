using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.ExecuteOwnership;

/// <summary>
///     Background lease renewal for long-running <c>ExecuteRunAsync</c> batches (TB-943 / DR-06).
/// </summary>
public sealed class RunExecuteOwnershipLeaseRenewalScope : IAsyncDisposable
{
    private readonly CancellationTokenSource _linkedCts;
    private readonly IRunExecuteOwnershipLeaseService _leaseService;
    private readonly ILogger _logger;
    private readonly Guid _runId;
    private readonly Task _renewalTask;

    private RunExecuteOwnershipLeaseRenewalScope(
        IRunExecuteOwnershipLeaseService leaseService,
        Guid runId,
        int renewIntervalSeconds,
        CancellationToken parentCancellationToken,
        ILogger logger)
    {
        _leaseService = leaseService;
        _runId = runId;
        _logger = logger;
        _linkedCts = CancellationTokenSource.CreateLinkedTokenSource(parentCancellationToken);
        _renewalTask = RunRenewalLoopAsync(renewIntervalSeconds, _linkedCts.Token);
    }

    public static RunExecuteOwnershipLeaseRenewalScope? TryBegin(
        IRunExecuteOwnershipLeaseService leaseService,
        IOptionsMonitor<RunExecuteOwnershipLeaseOptions> optionsMonitor,
        Guid runId,
        CancellationToken cancellationToken,
        ILogger logger)
    {
        if (!leaseService.IsEnabled)
            return null;

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
            cancellationToken,
            logger);
    }

    public ValueTask DisposeAsync()
    {
        _linkedCts.Cancel();
        _linkedCts.Dispose();

        return ValueTask.CompletedTask;
    }

    private async Task RunRenewalLoopAsync(int renewIntervalSeconds, CancellationToken cancellationToken)
    {
        try
        {
            using PeriodicTimer timer = new(TimeSpan.FromSeconds(renewIntervalSeconds));

            while (await timer.WaitForNextTickAsync(cancellationToken).ConfigureAwait(false))
            {
                await _leaseService.RenewAsync(_runId, cancellationToken).ConfigureAwait(false);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
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
