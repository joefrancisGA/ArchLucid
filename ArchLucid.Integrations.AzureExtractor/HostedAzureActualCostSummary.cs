namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Subscription-scope ActualCost rollup aligned with Tier 1 <c>manifest.actualCostSummary</c>.
/// </summary>
public sealed record HostedAzureActualCostSummary(
    double TotalActualCostUsd,
    string CurrencyCode,
    string BillingPeriod,
    IReadOnlyList<HostedAzureActualCostServiceBreakdownRow> BreakdownByServiceName);

public sealed record HostedAzureActualCostServiceBreakdownRow(
    string ServiceName,
    double PreTaxCost);
