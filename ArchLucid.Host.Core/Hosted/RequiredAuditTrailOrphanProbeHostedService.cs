using ArchLucid.Host.Core.Audit;
using ArchLucid.Host.Core.Configuration;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Periodically probes for Required domain rows missing expected durable audit events (TB-955).
/// </summary>
/// <remarks>
/// When <c>HostLeaderElection:Enabled</c> is true and storage is SQL, only one replica runs the probe loop.
/// </remarks>
public sealed class RequiredAuditTrailOrphanProbeHostedService(
    IOptionsMonitor<RequiredAuditTrailProbeOptions> optionsMonitor,
    IRequiredAuditTrailOrphanProbeExecutor executor,
    IOptions<ArchLucidOptions> archLucidOptions,
    HostLeaderElectionCoordinator electionCoordinator,
    ILogger<RequiredAuditTrailOrphanProbeHostedService> logger) : BackgroundService
{
    private readonly IOptions<ArchLucidOptions> _archLucidOptions =
        archLucidOptions ?? throw new ArgumentNullException(nameof(archLucidOptions));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    private readonly IRequiredAuditTrailOrphanProbeExecutor _executor =
        executor ?? throw new ArgumentNullException(nameof(executor));

    private readonly ILogger<RequiredAuditTrailOrphanProbeHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IOptionsMonitor<RequiredAuditTrailProbeOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
            return Task.CompletedTask;

        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.RequiredAuditTrailOrphanProbe,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        try
        {
            await Task.Delay(TimeSpan.FromMinutes(3), leaderToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        while (!leaderToken.IsCancellationRequested)
        {
            RequiredAuditTrailProbeOptions snapshot = _optionsMonitor.CurrentValue;

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
                _logger.LogWarning(ex, "Required audit trail orphan probe failed.");
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
