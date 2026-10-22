namespace ArchLucid.Decisioning.Findings;

using System.Text.Json.Serialization;

/// <summary>Baseline findings paired with a frontier capture fixture.</summary>
public sealed class InsightDensityFrontierCaptureBaselineDocument
{
    [JsonConverter(typeof(FrontierBaselineSourceJsonConverter))]
    public required FrontierBaselineSource Source
    {
        get;
        init;
    }

    public List<InsightDensityFrontierCaptureBaselineFinding> Findings
    {
        get;
        init;
    } = [];
}
