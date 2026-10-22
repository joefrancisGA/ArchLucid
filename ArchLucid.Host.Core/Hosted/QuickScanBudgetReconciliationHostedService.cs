using ArchLucid.Application.Architecture;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Releases expired Quick Scan global budget reservations on a schedule (TB-899).</summary>
public sealed class QuickScanBudgetReconciliationHostedService(
    IQuickScanBudgetMonitoringService monitoringService,
    IOptionsMonitor<QuickScanSafetyOptions> safetyOptions,
    ILogger<QuickScanBudgetReconciliationHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly IQuickScanBudgetMonitoringService _monitoringService =
        monitoringService ?? throw new ArgumentNullException(nameof(monitoringService));

    private readonly IOptionsMonitor<QuickScanSafetyOptions> _safetyOptions =
        safetyOptions ?? throw new ArgumentNullException(nameof(safetyOptions));

    private readonly ILogger<QuickScanBudgetReconciliationHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_safetyOptions.CurrentValue.Enabled)
        {
            _logger.LogInformation("Quick Scan safety disabled; budget reconciliation hosted service is idle.");

            return Task.CompletedTask;
        }

        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.QuickScanBudgetReconciliation,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            int intervalMinutes = Math.Clamp(
                _safetyOptions.CurrentValue.BudgetMonitoring.ReconciliationIntervalMinutes,
                5,
                120);

            try
            {
                await _monitoringService.ReconcileAsync(leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Quick Scan budget reconciliation iteration failed.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromMinutes(intervalMinutes), leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
