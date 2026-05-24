using ArchLucid.Contracts.Marketing;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.Marketing;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Snapshots <c>dbo.MarketingPricingQuoteRequestsAging</c> every five minutes and records
///     <c>archlucid_pricing_quote_request_age_hours</c> for Prometheus SLA alerting.
/// </summary>
public sealed class MarketingPricingQuoteAgingMetricsHostedService(
    IServiceScopeFactory scopeFactory,
    ILogger<MarketingPricingQuoteAgingMetricsHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly ILogger<MarketingPricingQuoteAgingMetricsHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CollectOnceAsync(stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Marketing pricing quote aging metrics collection failed; will retry.");
            }

            try
            {
                await Task.Delay(Interval, stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    internal static void RecordSnapshot(IReadOnlyList<MarketingPricingQuoteRequestAgingRow> rows)
    {
        foreach (MarketingPricingQuoteRequestAgingRow row in rows)
        {
            ArchLucidInstrumentation.RecordPricingQuoteRequestAgeHours(row.AgeHours, row.BreachStatus);
        }
    }

    private async Task CollectOnceAsync(CancellationToken cancellationToken)
    {
        using IServiceScope scope = _scopeFactory.CreateScope();
        IMarketingPricingQuoteRequestAgingReader? reader =
            scope.ServiceProvider.GetService<IMarketingPricingQuoteRequestAgingReader>();

        if (reader is null)
            return;

        IReadOnlyList<MarketingPricingQuoteRequestAgingRow> rows =
            await reader.ListAsync(cancellationToken).ConfigureAwait(false);

        RecordSnapshot(rows);
    }
}
