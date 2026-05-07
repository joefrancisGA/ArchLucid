namespace ArchLucid.Application.Pilots;

/// <summary>
///     Sponsor-facing tri-state distilled from <see cref="PilotBuyerSafeEvidenceGateResult"/> — no scoring beyond the gate.
/// </summary>
public enum SponsorSafeProofDisposition
{
    /// <summary>No automated structural blockers surfaced; qualitative tables still operator-owned.</summary>
    Sendable,

    /// <summary>
    ///     Sendable-with-caveats posture from persisted proofs — sponsor copy needs operator reconciliation of listed gaps.
    /// </summary>
    NeedsOperatorReview,

    /// <summary>Demo-flagged run and/or structural hard gaps — external sponsor-safe circulation is premature.</summary>
    NotSponsorSafeYet,
}
