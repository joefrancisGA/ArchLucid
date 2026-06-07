using ArchLucid.Persistence.Coordination.Export;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Periodically drains <see cref="IRunExportBlobPushOutboxRepository" /> so run-export blob pushes complete durably.
/// </summary>
/// <remarks>
///     When <c>HostLeaderElection:Enabled</c> is true and storage is SQL, only one worker replica drains the outbox.
/// </remarks>
public sealed class RunExportBlobPushOutboxHostedService(
    IRunExportBlobPushOutboxProcessor processor,
    ILogger<RunExportBlobPushOutboxHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly IRunExportBlobPushOutboxProcessor _processor =
        processor ?? throw new ArgumentNullException(nameof(processor));

    private readonly ILogger<RunExportBlobPushOutboxHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.RunExportBlobPushOutbox,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            try
            {
                await _processor.ProcessPendingBatchAsync(leaderToken);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Run export blob push outbox host loop error.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(2), leaderToken);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
