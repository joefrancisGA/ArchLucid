using ArchLucid.Core.Costing;

namespace ArchLucid.Retrieval.Pricing;

/// <summary>
///     Production <see cref="IGcpRetailPriceStructuredLookup" /> backed by
///     <see cref="GcpCloudBillingCatalogClient" /> (TB-603).
/// </summary>
public sealed class GcpCloudBillingCatalogStructuredLookup(GcpCloudBillingCatalogClient catalogClient)
    : IGcpRetailPriceStructuredLookup
{
    private readonly GcpCloudBillingCatalogClient _catalogClient =
        catalogClient ?? throw new ArgumentNullException(nameof(catalogClient));

    /// <inheritdoc />
    public bool TryLookup(string serviceName, string region, string? machineType, out GcpRetailPriceRow row)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(serviceName);
        ArgumentException.ThrowIfNullOrWhiteSpace(region);

        if (string.IsNullOrWhiteSpace(machineType))
        {
            row = null!;
            return false;
        }

        decimal? monthlyUsd = _catalogClient
            .TryGetComputeEngineMonthlyUsdAsync(machineType, 1, CancellationToken.None)
            .GetAwaiter()
            .GetResult();

        if (monthlyUsd is null or <= 0m)
        {
            if (!GcpRetailPricesHeuristicFallback.TryGetMonthlyUsd(serviceName, machineType, out decimal heuristicMonthlyUsd))
            {
                row = null!;
                return false;
            }

            row = new GcpRetailPriceRow(
                serviceName,
                region,
                machineType,
                heuristicMonthlyUsd,
                "USD",
                IsHeuristicFallback: true);

            return true;
        }

        row = new GcpRetailPriceRow(
            serviceName,
            region,
            machineType,
            monthlyUsd.Value,
            "USD");

        return true;
    }

    /// <inheritdoc />
    public string FormatForPrompt(GcpRetailPriceRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        string prefix = row.IsHeuristicFallback ? "[Fallback Estimate] " : string.Empty;

        return prefix +
               $"GCP Billing Catalog row: service={row.ServiceName}; region={row.Region}; machineType={row.MachineType}; estimatedMonthlyUsd={row.EstimatedMonthlyUsd:0.####} {row.CurrencyCode}";
    }
}
