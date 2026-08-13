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
    ILogger<LlmMonthlyTenantBudgetReservationReclaimHostedService> logger) : BackgroundService
{
    private readonly ILlmMonthlyTenantBudgetReservationStore _reservationStore =
        reservationStore ?? throw new ArgumentNullException(nameof(reservationStore));

    private readonly IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<LlmMonthlyTenantBudgetReservationReclaimHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            LlmMonthlyTenantDollarBudgetOptions opts = _optionsMonitor.CurrentValue;
            int intervalSeconds = Math.Clamp(opts.ReservationReclaimIntervalSeconds, 15, 3600);

            try
            {
                if (opts.Enabled)
                {
                    LlmMonthlyTenantBudgetReclaimResult reclaimed =
                        await _reservationStore.ReclaimExpiredBatchAsync(stoppingToken).ConfigureAwait(false);

                    if (reclaimed.ReclaimedCount > 0)
                    {
                        ArchLucidInstrumentation.LlmMonthlyBudgetReservationReclaimedTotal.Add(reclaimed.ReclaimedCount);

                        _logger.LogInformation(
                            "Reclaimed {ReclaimedCount} expired monthly LLM budget reservation lease(s).",
                            reclaimed.ReclaimedCount);
                    }
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Monthly LLM budget reservation orphan reclaim failed.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(intervalSeconds), stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
