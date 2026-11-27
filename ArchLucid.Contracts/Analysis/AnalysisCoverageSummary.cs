namespace ArchLucid.Contracts.Analysis;

/// <summary>
/// Outcome of evaluating a bounded scope, independent of counts, approval, and capture success.
/// </summary>
public sealed class AnalysisCoverageSummary
{
    public string Scope { get; init; } = string.Empty;
    public string State { get; init; } = "unknown";
    public string Freshness { get; init; } = "unknown";
    public DateTime? EvidenceAsOfUtc { get; init; }
    public string Recovery { get; init; } = "unknown";
    public bool AdvisoryOnlyDegradation { get; init; }
    public IReadOnlyList<string> ReasonCodes { get; init; } = [];
    public IReadOnlyList<string> MissingSources { get; init; } = [];
    public IReadOnlyList<AnalysisStageCoverage> Stages { get; init; } = [];

    /// <summary>Whether an empty result can support an absence statement in this scope, not across the environment.</summary>
    public bool CanAssertAbsence => State == "complete" && Freshness is "current" or "historical";
}
