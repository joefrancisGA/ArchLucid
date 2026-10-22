namespace ArchLucid.Contracts.Governance.Coverage;

/// <summary>Resolved, explainable coverage for a prospective architecture run (not persisted).</summary>
public sealed class CoveragePreviewResult
{
    public bool FocusedPilotModeEnabled
    {
        get;
        set;
    }

    public string SummaryLine
    {
        get;
        set;
    } = string.Empty;

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

    public IReadOnlyList<CoveragePreviewAssignment> Assignments
    {
        get;
        set;
    } = [];
}
