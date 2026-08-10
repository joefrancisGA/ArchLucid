using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.DataConsistency;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
/// Periodically counts orphan coordinator rows and committed run header FK repoint violations,
/// emits warnings + Prometheus counters (detection-only). Optionally logs admin-equivalent
/// <c>SELECT</c> samples when <see cref="Configuration.DataConsistencyProbeOptions.OrphanProbeRemediationDryRunLogMaxRows"/> is set; never deletes.
/// </summary>
/// <remarks>
/// When <c>HostLeaderElection:Enabled</c> is true and storage is SQL, only one replica runs the probe loop.
/// </remarks>
public sealed class DataConsistencyOrphanProbeHostedService(
    IOptionsMonitor<DataConsistencyProbeOptions> optionsMonitor,
    IDataConsistencyOrphanProbeExecutor executor,
    IOptions<ArchLucidOptions> archLucidOptions,
    HostLeaderElectionCoordinator electionCoordinator,
    ILogger<DataConsistencyOrphanProbeHostedService> logger) : BackgroundService
{
    private readonly IOptions<ArchLucidOptions> _archLucidOptions =
        archLucidOptions ?? throw new ArgumentNullException(nameof(archLucidOptions));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    private readonly IDataConsistencyOrphanProbeExecutor _executor =
        executor ?? throw new ArgumentNullException(nameof(executor));

    private readonly ILogger<DataConsistencyOrphanProbeHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IOptionsMonitor<DataConsistencyProbeOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
            return Task.CompletedTask;

        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.DataConsistencyOrphanProbe,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        TimeSpan firstDelay = TimeSpan.FromMinutes(2);

        try
        {
            await Task.Delay(firstDelay, leaderToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        while (!leaderToken.IsCancellationRequested)
        {
            DataConsistencyProbeOptions snapshot = _optionsMonitor.CurrentValue;

            if (!snapshot.OrphanProbeEnabled)
            {
                await Task.Delay(TimeSpan.FromMinutes(5), leaderToken).ConfigureAwait(false);

                continue;
            }

            int minutes = Math.Clamp(snapshot.OrphanProbeIntervalMinutes, 5, 24 * 60);

            try
            {
                await _executor.RunOnceAsync(leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Data consistency orphan probe failed.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromMinutes(minutes), leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                return;
            }
        }
    }
}
