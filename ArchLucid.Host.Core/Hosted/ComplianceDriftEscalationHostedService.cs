using ArchLucid.Application.Governance;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Leader-elected poll that evaluates compliance drift thresholds and publishes escalation events.</summary>
public sealed class ComplianceDriftEscalationHostedService(
    IServiceProvider serviceProvider,
    HostLeaderElectionCoordinator electionCoordinator,
    IOptionsMonitor<ComplianceDriftEscalationOptions> escalationOptions,
    ILogger<ComplianceDriftEscalationHostedService> logger) : BackgroundService
{
    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.ComplianceDriftEscalationPolling,
            PollLoopAsync,
            stoppingToken);
    }

    private async Task PollLoopAsync(CancellationToken leaderToken)
    {
        logger.LogInformation("Compliance drift escalation scan started.");

        while (!leaderToken.IsCancellationRequested)
        {
            ComplianceDriftEscalationOptions options = escalationOptions.CurrentValue;
            int intervalHours = Math.Clamp(options.ScanIntervalHours, 1, 24 * 7);

            try
            {
                using IServiceScope scope = serviceProvider.CreateScope();
                ComplianceDriftEscalationScanner scanner =
                    scope.ServiceProvider.GetRequiredService<ComplianceDriftEscalationScanner>();

                await scanner.ScanDueAsync(TimeProvider.System.GetUtcNow(), leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex) when (!leaderToken.IsCancellationRequested)
            {
                logger.LogError(ex, "Compliance drift escalation scan iteration failed.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromHours(intervalHours), leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
