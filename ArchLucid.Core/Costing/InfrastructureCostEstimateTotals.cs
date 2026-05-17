namespace ArchLucid.Core.Costing;

/// <summary>Totals plus per-line detail for monthly infrastructure estimates.</summary>
public sealed record InfrastructureCostEstimateTotals(
    IReadOnlyList<InfrastructureCostLine> Lines,
    decimal TotalUsdPerMonth,
    bool AnyRetailPricing,
    bool AllRetailPricing);
