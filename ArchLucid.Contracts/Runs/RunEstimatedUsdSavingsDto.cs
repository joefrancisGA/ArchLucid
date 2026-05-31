namespace ArchLucid.Contracts.Runs;

/// <summary>
///     Server-authoritative estimated USD savings for a single run, derived from the findings snapshot using the same
///     resolver as executive ROI rollup.
/// </summary>
public sealed class RunEstimatedUsdSavingsDto
{
    /// <summary>Null when no findings snapshot or savings could not be resolved.</summary>
    public decimal? EstimatedUsdSavings
    {
        get;
        set;
    }

    /// <summary><see cref="Roi.ExecutiveRoiSavingsPricingBasis" /> label for finance reviewers.</summary>
    public string SavingsPricingBasis
    {
        get;
        set;
    } = Roi.ExecutiveRoiSavingsPricingBasis.Retail;

    /// <summary>Short sponsor-safe note describing how savings were priced.</summary>
    public string SavingsPricingBasisDescription
    {
        get;
        set;
    } = string.Empty;
}
