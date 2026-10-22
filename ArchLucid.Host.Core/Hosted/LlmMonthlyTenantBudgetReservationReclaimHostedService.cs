using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Reclaims expired monthly per-call USD reservation leases (TB-976).</summary>
public sealed class LlmMonthlyTenantBudgetReservationReclaimHostedService(
    ILlmMonthlyTenantBudgetReservationStore reservationStore,
    IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> optionsMonitor,
    ILogger<LlmMonthlyTenantBudgetReservationReclaimHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly ILlmMonthlyTenantBudgetReservationStore _reservationStore =
        reservationStore ?? throw new ArgumentNullException(nameof(reservationStore));

    private readonly IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<LlmMonthlyTenantBudgetReservationReclaimHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.LlmMonthlyTenantBudgetReservationReclaim,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            LlmMonthlyTenantDollarBudgetOptions opts = _optionsMonitor.CurrentValue;
            int intervalSeconds = Math.Clamp(opts.ReservationReclaimIntervalSeconds, 15, 3600);

            try
            {
                if (opts.Enabled)
                {
                    LlmMonthlyTenantBudgetReclaimResult reclaimed =
                        await _reservationStore.ReclaimExpiredBatchAsync(leaderToken).ConfigureAwait(false);

                    if (reclaimed.ReclaimedCount > 0)
                    {
                        ArchLucidInstrumentation.LlmMonthlyBudgetReservationReclaimedTotal.Add(reclaimed.ReclaimedCount);

                        _logger.LogInformation(
                            "Reclaimed {ReclaimedCount} expired monthly LLM budget reservation lease(s).",
                            reclaimed.ReclaimedCount);
                    }
                }
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Monthly LLM budget reservation orphan reclaim failed.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(intervalSeconds), leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
