namespace ArchLucid.Contracts.Persistence.Explanation;

/// <summary>
///     Slim read DTO for deterministic explainability evidence shared by Decisioning and Application layers.
/// </summary>
public sealed record FindingExplainabilityEvidenceRecord(
    IReadOnlyList<string> EvidenceRefs,
    string Conclusion,
    IReadOnlyList<string> AlternativePathsConsidered,
    string RuleId);
