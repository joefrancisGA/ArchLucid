using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Host.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
/// Periodically recomputes materialized <c>dbo.TenantHealthScores</c> for all tenants (leader-elected).
/// </summary>
public sealed class TenantHealthScoringHostedService(
    IServiceProvider serviceProvider,
    HostLeaderElectionCoordinator electionCoordinator,
    IOptionsMonitor<TenantHealthScoringOptions> optionsMonitor,
    ILogger<TenantHealthScoringHostedService> logger) : BackgroundService
{
    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.TenantHealthScoring,
            PollLoopAsync,
            stoppingToken);
    }

    private async Task PollLoopAsync(CancellationToken leaderToken)
    {
        TenantHealthScoringOptions initial = optionsMonitor.CurrentValue;

        if (!initial.Enabled)
        {
            logger.LogInformation("Tenant health scoring worker is disabled via configuration.");

            return;
        }

        logger.LogInformation(
            "Tenant health scoring worker started (interval {Hours} hours).",
            Math.Max(1, initial.IntervalHours));

        while (!leaderToken.IsCancellationRequested)
        {
            try
            {
                using IServiceScope scope = serviceProvider.CreateScope();
                ITenantCustomerSuccessRepository repository =
                    scope.ServiceProvider.GetRequiredService<ITenantCustomerSuccessRepository>();

                await repository.RefreshAllTenantHealthScoresAsync(leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex) when (!leaderToken.IsCancellationRequested)
            {
                logger.LogError(ex, "Tenant health scoring iteration failed.");
            }

            TenantHealthScoringOptions opts = optionsMonitor.CurrentValue;

            if (!opts.Enabled)
                break;

            TimeSpan delay = TimeSpan.FromHours(Math.Max(1, opts.IntervalHours));

            try
            {
                await Task.Delay(delay, leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
