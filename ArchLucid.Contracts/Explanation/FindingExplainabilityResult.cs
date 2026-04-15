namespace ArchLucid.Contracts.Explanation;

/// <summary>
/// Deterministic explainability payload for a single finding (from persisted <c>ExplainabilityTrace</c>, no LLM).
/// </summary>
public sealed class FindingExplainabilityResult
{
    public string FindingId { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string EngineType { get; set; } = string.Empty;

    public string Severity { get; set; } = string.Empty;

    public double TraceCompletenessRatio { get; set; }

    public List<string> GraphNodeIdsExamined { get; set; } = [];

    public List<string> RulesApplied { get; set; } = [];

    public List<string> DecisionsTaken { get; set; } = [];

    public List<string> AlternativePathsConsidered { get; set; } = [];

    public List<string> Notes { get; set; } = [];

    /// <summary>Deterministic plain-text narrative composed from explainability trace fields (server-side).</summary>
    public string NarrativeText { get; set; } = string.Empty;
}
