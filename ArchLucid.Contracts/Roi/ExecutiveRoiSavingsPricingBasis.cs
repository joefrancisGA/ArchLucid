namespace ArchLucid.Contracts.Roi;

/// <summary>Labels how executive ROI savings totals were priced for finance reviewers.</summary>
public static class ExecutiveRoiSavingsPricingBasis
{
    public const string Retail = "Retail";

    public const string EaAdjusted = "EA-adjusted";

    public const string UploadedActualAmortized = "Uploaded actual/amortized";

    public const string HeuristicFallback = "Heuristic fallback";

    /// <summary>
    ///     Resolves display basis from the tenant EA discount multiplier (1.0 = Retail list; &lt; 1.0 = EA-adjusted Cost
    ///     findings).
    /// </summary>
    public static string Resolve(decimal eaDiscountMultiplier)
    {
        if (eaDiscountMultiplier >= 1.0m)
            return Retail;

        return EaAdjusted;
    }

    /// <summary>Resolves pricing basis using tenant EA settings and cost evidence signals (labeling only).</summary>
    public static string Resolve(
        decimal eaDiscountMultiplier,
        bool hasUploadedCostEvidence,
        bool hasHeuristicCostEvidence)
    {
        if (hasUploadedCostEvidence)
            return UploadedActualAmortized;

        if (eaDiscountMultiplier < 1.0m)
            return EaAdjusted;

        if (hasHeuristicCostEvidence)
            return HeuristicFallback;

        return Retail;
    }
}
