namespace ArchLucid.Application.Pilots;

/// <summary>Publishing tier for sponsor-facing first-value artefacts (non-attestation labels only).</summary>
public enum PilotBuyerSafeEvidencePublishingTier
{
    /// <summary>Structural checks pass; not a demo tenant per <see cref="PilotRunDeltas.IsDemoTenant"/>.</summary>
    Complete = 0,

    /// <summary>Run is honest for internal review but has explicit gaps before external sponsor distribution.</summary>
    Partial = 1,

    /// <summary>
    ///     Demo-flagged tenant or structural hard gaps (missing committed manifest / zero audit rows); publishing posture
    ///     maps here alongside <see cref="ProofPackageSendability.NotSendable"/>.
    /// </summary>
    DemoOnly = 2,
}
