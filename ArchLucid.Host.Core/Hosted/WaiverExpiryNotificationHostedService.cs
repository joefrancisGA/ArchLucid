using ArchLucid.Core.Configuration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Leader-elected daily scan that makes waiver / risk-exception expiry authoritative and sends escalating
///     reminders (TB-2193), so accepted risk cannot lapse just because nobody signed in.
/// </summary>
public sealed class WaiverExpiryNotificationHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<WaiverExpiryNotificationOptions> optionsMonitor,
    ILogger<WaiverExpiryNotificationHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    private readonly ILogger<WaiverExpiryNotificationHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IOptionsMonitor<WaiverExpiryNotificationOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.WaiverExpiryNotification,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            WaiverExpiryNotificationOptions options = _optionsMonitor.CurrentValue;
            TimeSpan delay = TimeSpan.FromHours(Math.Clamp(options.IntervalHours, 1, 168));

            if (options.Enabled)
            {
                try
                {
                    await WaiverExpiryNotificationBackgroundWork.RunSinglePassAsync(
                            _scopeFactory,
                            _optionsMonitor,
                            _logger,
                            leaderToken)
                        .ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex) when (!leaderToken.IsCancellationRequested)
                {
                    if (_logger.IsEnabled(LogLevel.Error))
                        _logger.LogError(ex, "Waiver expiry notification iteration failed.");
                }
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
