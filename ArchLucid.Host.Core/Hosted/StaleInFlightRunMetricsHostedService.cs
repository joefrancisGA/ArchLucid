using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.Coordination.Diagnostics;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
/// Publishes fleet-wide stale in-flight run gauges and logs triage samples (tenant/run ids) when count &gt; 0 (TB-958).
/// Leader-elected so only one replica queries storage for the fleet snapshot.
/// </summary>
public sealed class StaleInFlightRunMetricsHostedService(
    IServiceScopeFactory scopeFactory,
    HostLeaderElectionCoordinator electionCoordinator,
    ILogger<StaleInFlightRunMetricsHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(120);

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    private readonly ILogger<StaleInFlightRunMetricsHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.StaleInFlightRunMetrics,
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
                _logger.LogWarning(ex, "Stale in-flight run metrics collection failed; will retry.");
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
        IStaleInFlightRunMetricsReader? reader =
            scope.ServiceProvider.GetService<IStaleInFlightRunMetricsReader>();

        if (reader is null)
            return;

        StaleInFlightRunMetricsSnapshot snap = await reader.ReadSnapshotAsync(ct);

        StaleInFlightRunGaugeValues values = new(snap.StaleInFlightCount, snap.OldestStaleAgeSeconds);
        ArchLucidInstrumentation.StaleInFlightRunGauges.Publish(in values);

        if (snap.StaleInFlightCount <= 0)
            return;

        // Tenant/run identity stays in logs — never Prom labels (cardinality budget for TB-958).
        foreach (StaleInFlightRunTriageSample sample in snap.TriageSamples)
        {
            _logger.LogWarning(
                "Stale in-flight run detected. TenantId={TenantId} RunId={RunId} Status={Status} AgeSeconds={AgeSeconds} FleetStaleCount={FleetStaleCount}",
                sample.TenantId,
                sample.RunId,
                sample.Status,
                sample.AgeSeconds,
                snap.StaleInFlightCount);
        }
    }
}
