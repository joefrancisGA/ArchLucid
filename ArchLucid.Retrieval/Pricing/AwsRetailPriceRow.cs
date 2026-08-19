namespace ArchLucid.Retrieval.Pricing;

/// <summary>One AWS Price List row for structured (non-embedding) lookup.</summary>
public sealed record AwsRetailPriceRow(
    string ServiceName,
    string Region,
    string InstanceType,
    decimal EstimatedMonthlyUsd,
    string CurrencyCode,
    bool IsHeuristicFallback = false);
