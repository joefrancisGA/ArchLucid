namespace ArchLucid.Retrieval.Pricing;

/// <summary>Structured lookup for AWS public on-demand pricing rows (TB-603).</summary>
public interface IAwsRetailPriceStructuredLookup
{
    bool TryLookup(string serviceName, string region, string? instanceType, out AwsRetailPriceRow row);

    string FormatForPrompt(AwsRetailPriceRow row);
}

/// <inheritdoc cref="IAwsRetailPriceStructuredLookup" />
public sealed class InMemoryAwsRetailPriceStructuredLookup : IAwsRetailPriceStructuredLookup
{
    private readonly IReadOnlyList<AwsRetailPriceRow> _rows;

    public InMemoryAwsRetailPriceStructuredLookup(IEnumerable<AwsRetailPriceRow>? seedRows = null)
    {
        _rows = seedRows?.ToList() ?? DefaultRows();
    }

    /// <inheritdoc />
    public bool TryLookup(string serviceName, string region, string? instanceType, out AwsRetailPriceRow row) =>
        InMemoryRetailPriceLookupMatcher.TryMatch(
            _rows,
            serviceName,
            region,
            instanceType,
            static candidate => candidate.ServiceName,
            static candidate => candidate.Region,
            static candidate => candidate.InstanceType,
            out row);

    /// <inheritdoc />
    public string FormatForPrompt(AwsRetailPriceRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        string prefix = row.IsHeuristicFallback ? "[Fallback Estimate] " : string.Empty;

        return prefix +
               $"AWS Price List row: service={row.ServiceName}; region={row.Region}; instanceType={row.InstanceType}; estimatedMonthlyUsd={row.EstimatedMonthlyUsd:0.####} {row.CurrencyCode}";
    }

    private static List<AwsRetailPriceRow> DefaultRows()
    {
        return
        [
            new AwsRetailPriceRow("AmazonEC2", "us-east-1", "m5.large", 70.08m, "USD"),
            new AwsRetailPriceRow("AmazonEC2", "us-west-2", "t3.micro", 7.59m, "USD"),
        ];
    }
}
