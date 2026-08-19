using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Workers;

/// <summary>
///     API-role draft intake reaper (same lease and logic as <see cref="DraftIntakeReaperHostedService" />).
/// </summary>
public sealed class DraftIntakeReaperWorker(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<DraftIntakeReaperOptions> optionsMonitor,
    ILogger<DraftIntakeReaperWorker> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<DraftIntakeReaperOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<DraftIntakeReaperWorker> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.DraftIntakeReaper,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            DraftIntakeReaperOptions opts = _optionsMonitor.CurrentValue;
            TimeSpan delay = TimeSpan.FromHours(Math.Clamp(opts.IntervalHours, 1, 168));

            if (opts.Enabled)
            {
                await DraftIntakeReaperBackgroundWork.RunTtlPassAsync(
                    _scopeFactory,
                    _optionsMonitor,
                    _logger,
                    leaderToken);
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
