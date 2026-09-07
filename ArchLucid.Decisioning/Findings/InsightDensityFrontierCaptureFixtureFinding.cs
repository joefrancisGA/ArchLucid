namespace ArchLucid.Decisioning.Findings;

/// <summary>Decision-grade finding row embedded in a frontier capture fixture.</summary>
public sealed class InsightDensityFrontierCaptureFixtureFinding
{
    public required string FindingId
    {
        get;
        init;
    }

    public required string EngineType
    {
        get;
        init;
    }

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

    public string? PolicyRuleId
    {
        get;
        init;
    }

    public required string Classification
    {
        get;
        init;
    }
}
