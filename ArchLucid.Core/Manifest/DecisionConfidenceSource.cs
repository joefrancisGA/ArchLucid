namespace ArchLucid.Core.Manifest;

/// <summary>Provenance for a manifest decision's numeric confidence, when present.</summary>
public enum DecisionConfidenceSource
{
    Unknown,
    NotComputed,
    FindingAggregate,
    FindingEvaluation,
    RuleEngine,
    LlmAgent,
    Calibrated,
}
