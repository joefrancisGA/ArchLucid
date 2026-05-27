namespace ArchLucid.Decisioning.Findings;

/// <summary>Gate-derived score, level, and computation status for operator-facing finding confidence.</summary>
public sealed record FindingConfidenceCalculationResult(
    FindingConfidenceStatus Status,
    int? Score,
    FindingConfidenceLevel? Level,
    string? FailureReason = null);
