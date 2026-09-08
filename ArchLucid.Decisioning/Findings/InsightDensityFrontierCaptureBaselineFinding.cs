namespace ArchLucid.Decisioning.Findings;

/// <summary>Baseline finding row embedded in a frontier capture fixture.</summary>
public sealed class InsightDensityFrontierCaptureBaselineFinding
{
    public required string Category
    {
        get;
        init;
    }

    public required string Title
    {
        get;
        init;
    }

    public string? RuleId
    {
        get;
        init;
    }
}
