using ArchLucid.Application.GcpExtractor;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Leader-elected Tier-2 GCP extractor auto-pull (Azure MI → Workload Identity Federation → Asset Inventory → ingest).
/// </summary>
public sealed class GcpExtractorAutoPullHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<GcpExtractorAutoPullOptions> optionsMonitor,
    ILogger<GcpExtractorAutoPullHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<GcpExtractorAutoPullOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<GcpExtractorAutoPullHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.GcpExtractorAutoPull,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            GcpExtractorAutoPullOptions opts = _optionsMonitor.CurrentValue;
            int hours = Math.Clamp(opts.IntervalHours, 1, 168);
            TimeSpan delay = TimeSpan.FromHours(hours);

            if (opts.Enabled)
            {
                try
                {
                    if (_logger.IsEnabled(LogLevel.Information))
                    {
                        _logger.LogInformation(
                            "GCP extractor auto-pull leader loop invoking scheduled pass (interval {IntervalHours} hours).",
                            hours);
                    }

                    using IServiceScope scope = _scopeFactory.CreateScope();
                    IGcpExtractorAutoPullOrchestrator orchestrator =
                        scope.ServiceProvider.GetRequiredService<IGcpExtractorAutoPullOrchestrator>();

                    await orchestrator.RunScheduledPullAsync(leaderToken).ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    if (_logger.IsEnabled(LogLevel.Warning))
                    {
                        _logger.LogWarning(
                            ex,
                            "GCP extractor auto-pull pass faulted before completion; leader loop continues fail-open after {Delay}.",
                            delay);
                    }
                }
            }
            else
            {
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug(
                        "GCP extractor auto-pull disabled (CloudPolling:Gcp:Enabled=false). Sleeping {Delay}.",
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
