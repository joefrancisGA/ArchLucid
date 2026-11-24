namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Pipeline hooks for closed-loop Architecture Intelligence (TB-2352).
/// </summary>
public sealed class ArchitectureIntelligencePipelineOptions
{
    public const string SectionPath = "ArchitectureIntelligence";

    /// <summary>Aggregate allowance reserved by semantic verification in one service scope.</summary>
    public int SemanticVerificationTokenAllowance { get; set; } = 16_384;

    /// <summary>Aggregate estimated USD allowance for semantic verification in one service scope.</summary>
    public decimal SemanticVerificationEstimatedUsdAllowance { get; set; } = 0.25m;

    /// <summary>Maximum elapsed time for each material semantic review call.</summary>
    public TimeSpan SemanticVerificationCallTimeout { get; set; } = TimeSpan.FromSeconds(10);

    /// <summary>
    ///     When enabled, golden-cohort runs receive a closed-loop strengthening pass before artifact synthesis.
    /// </summary>
    public bool StrengthenDefaultPackage
    {
        get;
        set;
    }

    /// <summary>
    ///     When enabled, all review packages receive closed-loop strengthening (not only golden cohort).
    /// </summary>
    public bool StrengthenAllReviewPackages
    {
        get;
        set;
    }

    /// <summary>
    ///     When false, specialist and adversarial review async paths use heuristic implementations only.
    /// </summary>
    public bool UseLlmReview
    {
        get;
        set;
    } = true;
}
