using System.Diagnostics.Metrics;

using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Hosting;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Leader-elected refresh of <c>archlucid_tenant_estimated_savings_usd</c> using the same executive ROI rollup path
///     as <see cref="IExecutiveRoiSummaryService.BuildAsync" /> (cross-run dedup per §2.8).
/// </summary>
public sealed class ExecutiveRoiSavingsGaugeHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<ExecutiveRoiSavingsGaugeOptions> optionsMonitor,
    HostLeaderElectionCoordinator electionCoordinator,
    ILogger<ExecutiveRoiSavingsGaugeHostedService> logger) : BackgroundService
{
    public static ExecutiveRoiSavingsGaugeState GaugeState { get; } = new();

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<ExecutiveRoiSavingsGaugeOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    private readonly ILogger<ExecutiveRoiSavingsGaugeHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.ExecutiveRoiSavingsGauge,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            ExecutiveRoiSavingsGaugeOptions opts = _optionsMonitor.CurrentValue;

            if (opts.Enabled)
            {
                try
                {
                    await RefreshGaugeAsync(opts, leaderToken).ConfigureAwait(false);
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
                            "Executive ROI savings gauge refresh failed; retaining last-known gauge values.");
                    }
                }
            }

            TimeSpan delay = TimeSpan.FromMinutes(Math.Clamp(opts.RefreshIntervalMinutes, 1, 1440));

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

    private async Task RefreshGaugeAsync(ExecutiveRoiSavingsGaugeOptions opts, CancellationToken cancellationToken)
    {
        using IServiceScope scope = _scopeFactory.CreateScope();
        ITenantRepository tenantRepository = scope.ServiceProvider.GetRequiredService<ITenantRepository>();
        IExecutiveRoiSummaryService roiService = scope.ServiceProvider.GetRequiredService<IExecutiveRoiSummaryService>();

        List<(Guid TenantId, decimal SavingsUsd)> perTenantRows = [];
        decimal platformTotal = 0m;

        await ExecutiveRoiBackgroundTenantRollup.ForEachActiveTenantAsync(
            tenantRepository,
            async (tenantScope, ct) =>
            {
                ExecutiveRoiSummaryResponse summary = await roiService.BuildAsync(ct).ConfigureAwait(false);
                decimal tenantTotal = summary.TotalEstimatedUsdSavings;
                platformTotal += tenantTotal;
                perTenantRows.Add((tenantScope.TenantId, tenantTotal));
            },
            _logger,
            cancellationToken).ConfigureAwait(false);

        Measurement<double>[] measurements = ExecutiveRoiSavingsGaugeTelemetry.BuildMeasurements(
            platformTotal,
            perTenantRows,
            opts.RecordPerTenantSavings);

        GaugeState.PublishMeasurements(measurements);

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Executive ROI savings gauge refreshed: platform total {PlatformUsd} USD across {TenantCount} tenants.",
                platformTotal,
                perTenantRows.Count);
        }
    }
}
