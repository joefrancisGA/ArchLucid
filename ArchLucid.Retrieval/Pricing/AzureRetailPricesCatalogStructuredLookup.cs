using ArchLucid.Core.Costing;
using ArchLucid.Core.Diagnostics;

namespace ArchLucid.Retrieval.Pricing;

/// <summary>
///     Production <see cref="IAzureRetailPriceStructuredLookup" /> backed by
///     <see cref="AzureRetailPricesCatalogClient" /> (RAG-V1-003).
/// </summary>
public sealed class AzureRetailPricesCatalogStructuredLookup(
    AzureRetailPricesCatalogClient catalog,
    IAzureRetailPriceTenantCostSettingsContext tenantCostSettingsContext) : IAzureRetailPriceStructuredLookup
{
    private readonly AzureRetailPricesCatalogClient _catalog =
        catalog ?? throw new ArgumentNullException(nameof(catalog));

    private readonly IAzureRetailPriceTenantCostSettingsContext _tenantCostSettingsContext =
        tenantCostSettingsContext ?? throw new ArgumentNullException(nameof(tenantCostSettingsContext));

    /// <inheritdoc />
    public bool TryLookup(string serviceName, string region, string? sku, out AzureRetailPriceRow row)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(serviceName);
        ArgumentException.ThrowIfNullOrWhiteSpace(region);

        if (string.IsNullOrWhiteSpace(sku))
        {
            row = null!;
            return false;
        }

        decimal? monthlyUsd = _catalog
            .TryGetConsumptionMonthlyUsdAsync(serviceName, region, sku, 1, CancellationToken.None)
            .GetAwaiter()
            .GetResult();

        if (monthlyUsd is null or <= 0m)
        {
            if (!AzureRetailPricesHeuristicFallback.TryGetMonthlyUsd(serviceName, sku, out decimal heuristicMonthlyUsd))
            {
                row = null!;
                return false;
            }

            ArchLucidInstrumentation.RecordAzureRetailPricesHeuristicFallback(serviceName, sku);

            row = ApplyEaDiscount(new AzureRetailPriceRow(
                serviceName,
                MeterName: sku,
                region,
                sku,
                UnitPriceUsd: heuristicMonthlyUsd,
                CurrencyCode: "USD",
                IsHeuristicFallback: true));

            return true;
        }

        row = ApplyEaDiscount(new AzureRetailPriceRow(
            serviceName,
            MeterName: sku,
            region,
            sku,
            UnitPriceUsd: monthlyUsd.Value,
            CurrencyCode: "USD"));

        return true;
    }

    /// <inheritdoc />
    public string FormatForPrompt(AzureRetailPriceRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        string prefix = row.IsHeuristicFallback ? "[Fallback Estimate] " : string.Empty;

        return prefix +
               $"Azure Retail row: service={row.ServiceName}; meter={row.MeterName}; region={row.Region}; sku={row.Sku}; estimatedMonthlyUsd={row.UnitPriceUsd:0.####} {row.CurrencyCode}";
    }

    private AzureRetailPriceRow ApplyEaDiscount(AzureRetailPriceRow row)
    {
        decimal multiplier = _tenantCostSettingsContext.EaDiscountMultiplier;

        if (multiplier >= 1.0m)
            return row;

        return row with { UnitPriceUsd = row.UnitPriceUsd * multiplier };
    }
}
