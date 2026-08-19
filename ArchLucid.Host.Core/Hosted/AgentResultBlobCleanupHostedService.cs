using ArchLucid.Persistence.Archival;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Daily leader-elected pass that deletes orphaned agent-trace blobs via
///     <see cref="IAgentTraceOrphanBlobCleanupService" /> when
///     <see cref="DataArchivalBlobCleanupOptions.Enabled" /> is true.
/// </summary>
public sealed class AgentResultBlobCleanupHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<DataArchivalOptions> optionsMonitor,
    ILogger<AgentResultBlobCleanupHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<DataArchivalOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<AgentResultBlobCleanupHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.AgentResultBlobCleanup,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            DataArchivalOptions opts = _optionsMonitor.CurrentValue;
            TimeSpan delay = TimeSpan.FromHours(Math.Clamp(opts.IntervalHours, 1, 168));

            if (opts.BlobCleanup.Enabled)
            {
                try
                {
                    await using AsyncServiceScope scope = _scopeFactory.CreateAsyncScope();
                    IAgentTraceOrphanBlobCleanupService cleanup =
                        scope.ServiceProvider.GetRequiredService<IAgentTraceOrphanBlobCleanupService>();

                    int deleted = await cleanup.DeleteOrphanedBlobsAsync(opts.BlobCleanup, leaderToken).ConfigureAwait(false);

                    if (deleted > 0)
                    {
                        _logger.LogInformation(
                            "Agent result blob cleanup pass completed: deleted {Deleted} blob object(s).",
                            deleted);
                    }
                }
                catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Agent result blob cleanup pass failed.");
                }
            }

            try
            {
                await Task.Delay(delay, leaderToken);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
