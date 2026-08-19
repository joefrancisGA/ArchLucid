namespace ArchLucid.Core.Safety;

/// <summary>Outcome of a content-safety check on LLM input or output text.</summary>
public sealed record ContentSafetyResult(
    bool IsAllowed,
    string? BlockReason,
    string? Category,
    double? Severity);
