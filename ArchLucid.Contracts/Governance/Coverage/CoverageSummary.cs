namespace ArchLucid.Contracts.Governance.Coverage;

/// <summary>Read model aggregating coverage assignments for UI and API disclosure.</summary>
public sealed class CoverageSummary
{
    /// <summary>True when no coverage rows exist (historical reviews before the coverage feature).</summary>
    public bool LegacyCoverageNotRecorded
    {
        get;
        set;
    }

    public int ProviderNeutralBaselineCount
    {
        get;
        set;
    }

    public int OrganizationRequiredCount
    {
        get;
        set;
    }

    public int PlatformOverlayCount
    {
        get;
        set;
    }

    public int ContextualRecommendedCount
    {
        get;
        set;
    }

    public int AdditionalOptionalCount
    {
        get;
        set;
    }

    public IReadOnlyList<CoverageAssignment> Assignments
    {
        get;
        set;
    } = [];
}
