using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Archives <c>dbo.FirstTenantFunnelEvents</c> rows older than the configured retention window to Azure Blob
///     Storage (JSON lines), then deletes them from SQL after a successful upload.
/// </summary>
public sealed class FirstTenantFunnelArchivalHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<FirstTenantFunnelOptions> funnelOptions,
    ILogger<FirstTenantFunnelArchivalHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<FirstTenantFunnelOptions> _funnelOptions =
        funnelOptions ?? throw new ArgumentNullException(nameof(funnelOptions));

    private readonly ILogger<FirstTenantFunnelArchivalHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.FirstTenantFunnelArchival,
            RunLoopAsync,
            stoppingToken);
    }

    private async Task RunLoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            FirstTenantFunnelOptions opts = _funnelOptions.CurrentValue;
            int intervalHours = opts.ArchivalIntervalHours > 0 ? opts.ArchivalIntervalHours : 24;
            TimeSpan delay = TimeSpan.FromHours(intervalHours);

            try
            {
                await FirstTenantFunnelArchivalIteration.RunOnceAsync(_scopeFactory, opts, _logger, leaderToken)
                    .ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "FirstTenantFunnel archival cycle failed.");
            }

            try
            {
                await Task.Delay(delay, leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
