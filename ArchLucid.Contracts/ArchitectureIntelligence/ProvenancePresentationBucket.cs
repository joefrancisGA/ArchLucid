namespace ArchLucid.Contracts.ArchitectureIntelligence;

/// <summary>
/// Collapsed operator-facing provenance presentation (TB-1984).
/// Full claim-origin × support-status combinations collapse into these buckets.
/// </summary>
public enum ProvenancePresentationBucket
{
    /// <summary>Directly established from an immutable source passage.</summary>
    SourceBacked = 0,

    /// <summary>Derived or inferred; support is partial or model-reasoned.</summary>
    Inferred = 1,

    /// <summary>Hypothesis / adversarial challenge; not a substantiated finding.</summary>
    Hypothesis = 2,

    /// <summary>Insufficient evidence or unverified external claim.</summary>
    Unverified = 3,
}
