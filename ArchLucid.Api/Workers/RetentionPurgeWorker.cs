using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Workers;

/// <summary>
///     API-role retention worker: hard-deletes <c>dbo.Projects</c> that were soft-deleted longer than
///     <see cref="ArchitectureProjectRetentionPurgeOptions.RetentionDays" /> ago (default 30), on the same schedule as
///     <see cref="ArchitectureProjectRetentionPurgeHostedService" />. Registered only when <c>Hosting:Role</c> is
///     <see cref="ArchLucidHostingRole.Api" /> so Combined/Worker hosts do not double-run the loop.
/// </summary>
public sealed class RetentionPurgeWorker(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions> optionsMonitor,
    ILogger<RetentionPurgeWorker> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<RetentionPurgeWorker> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.ArchitectureProjectRetentionPurge,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            ArchitectureProjectRetentionPurgeOptions opts = _optionsMonitor.CurrentValue;
            TimeSpan delay = TimeSpan.FromHours(Math.Clamp(opts.IntervalHours, 1, 168));

            if (opts.Enabled)
            {
                await ArchitectureProjectRetentionPurgeBackgroundWork.RunSinglePassAsync(
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
