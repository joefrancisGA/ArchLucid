using ArchLucid.Core.Configuration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Leader-elected loop that hard-purges tenants past scheduled erasure eligibility.</summary>
public sealed class TenantErasureEligiblePurgeHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<TenantErasurePurgeOptions> optionsMonitor,
    ILogger<TenantErasureEligiblePurgeHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<TenantErasurePurgeOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<TenantErasureEligiblePurgeHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(HostElectionLeaseNames.TenantErasureEligiblePurge, LoopAsync, stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            TenantErasurePurgeOptions opts = _optionsMonitor.CurrentValue;
            TimeSpan delay = TimeSpan.FromHours(Math.Clamp(opts.IntervalHours, 1, 168));

            if (opts.Enabled)
            {
                await TenantErasureEligiblePurgeBackgroundWork.RunSinglePassAsync(
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
