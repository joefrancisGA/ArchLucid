namespace ArchLucid.Retrieval.Pricing;

/// <summary>One Azure Retail Prices row for structured (non-embedding) lookup.</summary>
public sealed record AzureRetailPriceRow(
    string ServiceName,
    string MeterName,
    string Region,
    string Sku,
    decimal UnitPriceUsd,
    string CurrencyCode);

/// <summary>Structured lookup for Azure Retail Prices rows (RAG-V1-003).</summary>
public interface IAzureRetailPriceStructuredLookup
{
    bool TryLookup(string serviceName, string region, string? sku, out AzureRetailPriceRow row);

    string FormatForPrompt(AzureRetailPriceRow row);
}

/// <inheritdoc cref="IAzureRetailPriceStructuredLookup" />
public sealed class InMemoryAzureRetailPriceStructuredLookup : IAzureRetailPriceStructuredLookup
{
    private readonly IReadOnlyList<AzureRetailPriceRow> _rows;

    public InMemoryAzureRetailPriceStructuredLookup(IEnumerable<AzureRetailPriceRow>? seedRows = null)
    {
        _rows = seedRows?.ToList() ?? DefaultRows();
    }

    /// <inheritdoc />
    public bool TryLookup(string serviceName, string region, string? sku, out AzureRetailPriceRow row)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(serviceName);
        ArgumentException.ThrowIfNullOrWhiteSpace(region);

        foreach (AzureRetailPriceRow candidate in _rows)
        {
            if (!candidate.ServiceName.Equals(serviceName, StringComparison.OrdinalIgnoreCase))
                continue;

            if (!candidate.Region.Equals(region, StringComparison.OrdinalIgnoreCase))
                continue;

            if (!string.IsNullOrWhiteSpace(sku)
                && !candidate.Sku.Equals(sku, StringComparison.OrdinalIgnoreCase))
                continue;

            row = candidate;
            return true;
        }

        row = null!;
        return false;
    }

    /// <inheritdoc />
    public string FormatForPrompt(AzureRetailPriceRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        return
            $"Azure Retail row: service={row.ServiceName}; meter={row.MeterName}; region={row.Region}; sku={row.Sku}; unitPrice={row.UnitPriceUsd:0.####} {row.CurrencyCode}";
    }

    private static List<AzureRetailPriceRow> DefaultRows()
    {
        return
        [
            new AzureRetailPriceRow(
                "Virtual Machines",
                "D2s v5",
                "eastus",
                "Standard_D2s_v5",
                0.096m,
                "USD"),
            new AzureRetailPriceRow(
                "Storage",
                "Premium SSD Managed Disks",
                "eastus",
                "P10",
                0.0171m,
                "USD"),
        ];
    }
}
