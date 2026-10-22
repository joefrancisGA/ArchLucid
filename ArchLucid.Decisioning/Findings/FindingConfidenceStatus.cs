namespace ArchLucid.Decisioning.Findings;

/// <summary>Whether a gate-derived finding confidence score was computed, is unknown, or failed.</summary>
public enum FindingConfidenceStatus
{
    Computed,
    Unknown,
    Failed,
}
