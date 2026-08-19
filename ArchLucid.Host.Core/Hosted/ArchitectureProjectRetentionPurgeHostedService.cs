using ArchLucid.Core.Configuration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Leader-elected daily loop that permanently deletes soft-deleted <c>dbo.Projects</c> past retention and audits each
///     removed id.
/// </summary>
public sealed class ArchitectureProjectRetentionPurgeHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions> optionsMonitor,
    ILogger<ArchitectureProjectRetentionPurgeHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<ArchitectureProjectRetentionPurgeHostedService> _logger =
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
