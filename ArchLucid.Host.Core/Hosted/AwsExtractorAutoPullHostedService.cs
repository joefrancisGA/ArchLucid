using ArchLucid.Application.AwsExtractor;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Leader-elected Tier-2 AWS extractor auto-pull (Azure MI OIDC → AssumeRole → Resource Explorer → ingest).
/// </summary>
public sealed class AwsExtractorAutoPullHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<AwsExtractorAutoPullOptions> optionsMonitor,
    ILogger<AwsExtractorAutoPullHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<AwsExtractorAutoPullOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<AwsExtractorAutoPullHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.AwsExtractorAutoPull,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            AwsExtractorAutoPullOptions opts = _optionsMonitor.CurrentValue;
            int hours = Math.Clamp(opts.IntervalHours, 1, 168);
            TimeSpan delay = TimeSpan.FromHours(hours);

            if (opts.Enabled)
            {
                try
                {
                    if (_logger.IsEnabled(LogLevel.Information))
                    {
                        _logger.LogInformation(
                            "AWS extractor auto-pull leader loop invoking scheduled pass (interval {IntervalHours} hours).",
                            hours);
                    }

                    using IServiceScope scope = _scopeFactory.CreateScope();
                    IAwsExtractorAutoPullOrchestrator orchestrator =
                        scope.ServiceProvider.GetRequiredService<IAwsExtractorAutoPullOrchestrator>();

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
                            "AWS extractor auto-pull pass faulted before completion; leader loop continues fail-open after {Delay}.",
                            delay);
                    }
                }
            }
            else
            {
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug(
                        "AWS extractor auto-pull disabled (CloudPolling:Aws:Enabled=false). Sleeping {Delay}.",
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
