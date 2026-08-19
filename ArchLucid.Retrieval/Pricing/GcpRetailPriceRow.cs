namespace ArchLucid.Retrieval.Pricing;

/// <summary>One GCP Cloud Billing Catalog row for structured (non-embedding) lookup.</summary>
public sealed record GcpRetailPriceRow(
    string ServiceName,
    string Region,
    string MachineType,
    decimal EstimatedMonthlyUsd,
    string CurrencyCode,
    bool IsHeuristicFallback = false);
