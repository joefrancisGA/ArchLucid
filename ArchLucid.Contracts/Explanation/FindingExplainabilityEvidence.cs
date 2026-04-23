namespace ArchLucid.Contracts.Explanation;

/// <summary>
///     Deterministic, engine-sourced explainability facts for one finding (never derived from LLM text).
/// </summary>
public sealed record FindingExplainabilityEvidence(
    IReadOnlyList<string> EvidenceRefs,
    string Conclusion,
    IReadOnlyList<string> AlternativePathsConsidered,
    string RuleId);
