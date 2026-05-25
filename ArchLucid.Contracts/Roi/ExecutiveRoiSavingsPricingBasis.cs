namespace ArchLucid.Contracts.Roi;

/// <summary>Labels how executive ROI savings totals were priced for finance reviewers.</summary>
public static class ExecutiveRoiSavingsPricingBasis
{
    public const string Retail = "Retail";

    public const string EaAdjusted = "EA-adjusted";

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
}
