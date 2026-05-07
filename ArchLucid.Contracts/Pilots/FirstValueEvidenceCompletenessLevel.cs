namespace ArchLucid.Contracts.Pilots;

/// <summary>
///     Sponsor-facing first-value evidence classification (deterministic mapping from the buyer-safe gate — not a legal
///     attestation).
/// </summary>
public enum FirstValueEvidenceCompletenessLevel
{
    /// <summary>Complete tier, sendable, not demo-flagged — no structural or soft gaps on the gate.</summary>
    Strong = 0,

    /// <summary>Sendable with caveats or partial publishing posture (soft gaps only).</summary>
    Partial = 1,

    /// <summary>Demo tenant or structural hard gaps — PDF is still generated with a visible watermark / banner.</summary>
    Incomplete = 2,
}
