namespace ArchLucid.Core.Explanation;

/// <summary>
/// Explainability trace completeness for one finding (rule-engine coverage of <see cref="ArchLucid.Decisioning.Models.Finding.Trace"/> fields).
/// </summary>
public sealed class FindingTraceConfidenceDto
{
    public required string FindingId { get; init; }

    /// <summary>0.0–1.0 from <see cref="ArchLucid.Decisioning.Findings.ExplainabilityTraceCompletenessAnalyzer"/>.</summary>
    public double TraceCompletenessRatio { get; init; }

    /// <summary>Human label: High (≥0.8), Medium (≥0.5), Low.</summary>
    public required string TraceConfidenceLabel { get; init; }
}
