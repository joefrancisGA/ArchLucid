using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Leader-elected placeholder for Tier-2 Azure extractor auto-pull (federated credentials → ARM/cost snapshots →
///     architecture requests). Implements pacing + discovery logging only until ingest is productized.
/// </summary>
public sealed class AzureExtractorAutoPullHostedService(
    IOptionsMonitor<AzureExtractorAutoPullOptions> optionsMonitor,
    ILogger<AzureExtractorAutoPullHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
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
                _logger.LogInformation(
                    "Azure extractor Tier-2 auto-pull scaffold: ARM/Cost ingest not implemented yet (Batch 3). Next check in {Delay}.",
                    delay);
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
