namespace ArchLucid.Decisioning.Findings;

/// <summary>Baseline findings paired with a frontier capture fixture.</summary>
public sealed class InsightDensityFrontierCaptureBaselineDocument
{
    public List<InsightDensityFrontierCaptureBaselineFinding> Findings
    {
        get;
        init;
    } = [];
}
