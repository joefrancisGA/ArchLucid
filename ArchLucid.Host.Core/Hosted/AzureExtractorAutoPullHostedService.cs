using ArchLucid.Application.AzureExtractor;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Leader-elected Tier-2 Azure extractor auto-pull (WIF → ARM/cost snapshots → ingest pipeline).
/// </summary>
public sealed class AzureExtractorAutoPullHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<AzureExtractorAutoPullOptions> optionsMonitor,
    ILogger<AzureExtractorAutoPullHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
    private readonly IOptionsMonitor<AzureExtractorAutoPullOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<AzureExtractorAutoPullHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.AzureExtractorAutoPull,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            AzureExtractorAutoPullOptions opts = _optionsMonitor.CurrentValue;
            int minutes = Math.Clamp(opts.IntervalMinutes, 15, 10_080);
            TimeSpan delay = TimeSpan.FromMinutes(minutes);

            if (opts.Enabled)
            {
                try
                {
                    using IServiceScope scope = _scopeFactory.CreateScope();
                    IAzureExtractorAutoPullOrchestrator orchestrator =
                        scope.ServiceProvider.GetRequiredService<IAzureExtractorAutoPullOrchestrator>();

                    await orchestrator.RunScheduledPullAsync(leaderToken).ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    if (_logger.IsEnabled(LogLevel.Warning))
                        _logger.LogWarning(ex, "Azure extractor auto-pull pass failed; continuing fail-open.");
                }
            }
            else
            {
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug(
                        "Azure extractor auto-pull disabled (AzureExtractor:AutoPull:Enabled=false). Sleeping {Delay}.",
                        delay);
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
