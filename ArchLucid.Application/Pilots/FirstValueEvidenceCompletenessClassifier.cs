using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>Maps <see cref="PilotBuyerSafeEvidenceGateResult"/> to <see cref="FirstValueEvidenceCompletenessLevel"/>.</summary>
public static class FirstValueEvidenceCompletenessClassifier
{
    /// <summary>
    ///     Deterministic tri-state used in Markdown, JSON proof contract, and PDF watermarks. Demo runs and not-sendable
    ///     packages are always <see cref="FirstValueEvidenceCompletenessLevel.Incomplete"/>.
    /// </summary>
    public static FirstValueEvidenceCompletenessLevel Classify(PilotBuyerSafeEvidenceGateResult gate)
    {
        ArgumentNullException.ThrowIfNull(gate);

        if (gate.PublishingTier is PilotBuyerSafeEvidencePublishingTier.DemoOnly ||
            gate.ProofSendability is ProofPackageSendability.NotSendable)
            return FirstValueEvidenceCompletenessLevel.Incomplete;

        if (gate.PublishingTier is PilotBuyerSafeEvidencePublishingTier.Partial ||
            gate.ProofSendability is ProofPackageSendability.SendableWithCaveats)
            return FirstValueEvidenceCompletenessLevel.Partial;

        return FirstValueEvidenceCompletenessLevel.Strong;
    }
}
