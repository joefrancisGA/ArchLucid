using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.Coordination.Diagnostics;
using ArchLucid.Persistence.Tenancy.Diagnostics;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
/// Periodically reads SQL outbox depths and publishes them to <see cref="ArchLucidInstrumentation.OutboxDepthGauges"/>
/// for Prometheus scrape (observable gauges read cached values). Leader-elected so only one replica scrapes storage.
/// </summary>
public sealed class OutboxOperationalMetricsHostedService(
    IServiceScopeFactory scopeFactory,
    HostLeaderElectionCoordinator electionCoordinator,
    ILogger<OutboxOperationalMetricsHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(60);

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    private readonly ILogger<OutboxOperationalMetricsHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.OutboxOperationalMetrics,
            PollLoopAsync,
            stoppingToken);
    }

    private async Task PollLoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            try
            {
                await CollectOnceAsync(leaderToken);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Outbox operational metrics collection failed; will retry.");
            }

            try
            {
                await Task.Delay(Interval, leaderToken);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private async Task CollectOnceAsync(CancellationToken ct)
    {
        using IServiceScope scope = _scopeFactory.CreateScope();
        IOutboxOperationalMetricsReader? reader =
            scope.ServiceProvider.GetService<IOutboxOperationalMetricsReader>();

        if (reader is null)
            return;

        OutboxOperationalMetricsSnapshot snap = await reader.ReadSnapshotAsync(ct);

        ITrialFunnelOperationalMetricsReader? trialReader =
            scope.ServiceProvider.GetService<ITrialFunnelOperationalMetricsReader>();

        if (trialReader is not null)
        {
            long activeTrials = await trialReader.CountActiveSelfServiceTrialsAsync(ct);
            ArchLucidInstrumentation.PublishTrialActiveTenantCount(activeTrials);
        }

        OutboxDepthGaugeValues values = new(
            snap.AuthorityPipelineWorkPending,
            snap.AuthorityPipelineWorkOldestPendingAgeSeconds,
            snap.RetrievalIndexingOutboxPending,
            snap.RetrievalIndexingOutboxOldestPendingAgeSeconds,
            snap.RetrievalIndexingOutboxDeadLetter,
            snap.IntegrationEventOutboxPublishPending,
            snap.IntegrationEventOutboxDeadLetter,
            snap.IntegrationEventOutboxOldestActionablePendingAgeSeconds,
            snap.AuthorityPipelineWorkDeadLetter,
            snap.RunExportBlobPushOutboxPending,
            snap.RunExportBlobPushOutboxOldestPendingAgeSeconds,
            snap.RunExportBlobPushOutboxDeadLetter,
            snap.PostCommitProjectionOutboxPending,
            snap.PostCommitProjectionOutboxOldestPendingAgeSeconds,
            snap.PostCommitProjectionOutboxDeadLetter);

        ArchLucidInstrumentation.OutboxDepthGauges.Publish(in values);
    }
}
