namespace ArchLucid.Retrieval.Pricing;

/// <summary>Structured lookup for GCP Cloud Billing Catalog rows (TB-603).</summary>
public interface IGcpRetailPriceStructuredLookup
{
    bool TryLookup(string serviceName, string region, string? machineType, out GcpRetailPriceRow row);

    string FormatForPrompt(GcpRetailPriceRow row);
}

/// <inheritdoc cref="IGcpRetailPriceStructuredLookup" />
public sealed class InMemoryGcpRetailPriceStructuredLookup : IGcpRetailPriceStructuredLookup
{
    private readonly IReadOnlyList<GcpRetailPriceRow> _rows;

    public InMemoryGcpRetailPriceStructuredLookup(IEnumerable<GcpRetailPriceRow>? seedRows = null)
    {
        _rows = seedRows?.ToList() ?? DefaultRows();
    }

    /// <inheritdoc />
    public bool TryLookup(string serviceName, string region, string? machineType, out GcpRetailPriceRow row) =>
        InMemoryRetailPriceLookupMatcher.TryMatch(
            _rows,
            serviceName,
            region,
            machineType,
            static candidate => candidate.ServiceName,
            static candidate => candidate.Region,
            static candidate => candidate.MachineType,
            out row);

    /// <inheritdoc />
    public string FormatForPrompt(GcpRetailPriceRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        string prefix = row.IsHeuristicFallback ? "[Fallback Estimate] " : string.Empty;

        return prefix +
               $"GCP Billing Catalog row: service={row.ServiceName}; region={row.Region}; machineType={row.MachineType}; estimatedMonthlyUsd={row.EstimatedMonthlyUsd:0.####} {row.CurrencyCode}";
    }

    private static List<GcpRetailPriceRow> DefaultRows()
    {
        return
        [
            new GcpRetailPriceRow("Compute Engine", "us-central1", "n1-standard-2", 69.35m, "USD"),
            new GcpRetailPriceRow("Compute Engine", "us-east1", "e2-medium", 24.27m, "USD"),
        ];
    }
}
