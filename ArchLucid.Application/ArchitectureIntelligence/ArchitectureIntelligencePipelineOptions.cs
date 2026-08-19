namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Pipeline hooks for closed-loop Architecture Intelligence (TB-2352).
/// </summary>
public sealed class ArchitectureIntelligencePipelineOptions
{
    public const string SectionPath = "ArchitectureIntelligence";

    /// <summary>
    ///     When enabled, golden-cohort runs receive a closed-loop strengthening pass before artifact synthesis.
    /// </summary>
    public bool StrengthenDefaultPackage
    {
        get;
        set;
    }
}
