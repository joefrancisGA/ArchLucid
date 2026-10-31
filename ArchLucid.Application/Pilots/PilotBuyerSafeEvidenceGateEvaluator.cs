using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.ValueReports;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Derives a sponsor-send posture from persisted run + tenant value-window facts — no fabricated completeness.
/// </summary>
public static class PilotBuyerSafeEvidenceGateEvaluator
{
    /// <summary>
    ///     Computes <see cref="PilotBuyerSafeEvidenceGateResult"/> from the same inputs rendered in the first-value report.
    ///     Hard gaps (missing committed manifest, zero audit rows) plus demo tenants yield <see cref="PilotBuyerSafeEvidencePublishingTier.DemoOnly"/> with <see cref="ProofPackageSendability.NotSendable"/>; soft gaps yield <see cref="PilotBuyerSafeEvidencePublishingTier.Partial"/>.
    /// </summary>
    public static PilotBuyerSafeEvidenceGateResult Evaluate(
        ArchitectureRun run,
        GoldenManifest? manifest,
        PilotRunDeltas deltas,
        ValueReportSnapshot valueWindowSnapshot)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(valueWindowSnapshot);

        List<string> demoGaps = [];

        if (deltas.IsDemoTenant)
            demoGaps.Add(PilotDemoTenantDisciplineHonestyCopy.FailedPlain);

        List<string> hardGapMessages = [];

        if (string.IsNullOrWhiteSpace(run.RunId))
        {
            hardGapMessages.Add(PilotSupportRunIdHonestyCopy.MissingPlain);
        }

        if (manifest is null || run.Status != ArchitectureRunStatus.Committed)
        {
            hardGapMessages.Add(PilotCommittedManifestStatusHonestyCopy.FormatSponsorSafeConcreteGapLine());
        }

        List<string> softGapMessages = [];

        if (!deltas.AuditRowCountResolved)
        {
            softGapMessages.Add(PilotRunDeltasAuditRowCountFormatter.FormatSponsorSafeConcreteGapLineWhenUnresolved());
        }
        else if (deltas.AuditRowCount == 0)
        {
            hardGapMessages.Add(PilotRunDeltasAuditRowCountFormatter.FormatSponsorSafeConcreteGapLineWhenZero());
        }

        if (deltas is { AgentOutputPilotStrictSignalsResolved: true, AgentOutputPilotStrictViolatesSponsorEvidence: true })
        {
            hardGapMessages.Add(PilotAgentOutputPilotStrictHonestyCopy.FormatSponsorSafeConcreteGapLine());
        }

        if (manifest is not null && manifest.Metadata.CreatedUtc == default)
        {
            softGapMessages.Add(PilotCommittedManifestTimestampHonestyCopy.FormatSponsorSafeConcreteGapLine());
        }

        if (run.RealModeFellBackToSimulator)
        {
            softGapMessages.Add(PilotSimulatorSubstitutionHonestyCopy.FormatSponsorSafeConcreteGapLine());
        }

        if (deltas.TopFindingId is not null && deltas.TopFindingEvidenceChain is null)
        {
            softGapMessages.Add(PilotTopFindingEvidenceChainHonestyCopy.FormatSponsorSafeConcreteGapLineWhenUnavailable());
        }

        if (!deltas.LlmCallCountResolved)
        {
            softGapMessages.Add(PilotRunDeltasLlmCallCountFormatter.FormatSponsorSafeConcreteGapLine());
        }

        if (!deltas.AgentOutputPilotStrictSignalsResolved)
        {
            softGapMessages.Add(PilotAgentOutputPilotStrictHonestyCopy.FormatSponsorSafeConcreteGapLineWhenUnresolved());
        }

        ReviewCycleBaselineProvenance prov = valueWindowSnapshot.ReviewCycleBaselineProvenance;

        if (prov is ReviewCycleBaselineProvenance.NoMeasurementYet or ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions)
        {
            softGapMessages.Add(SponsorProofReadinessClassifier.FormatComparativeBaselineBuyerSafeGateSoftGapLine());
        }

        (PilotBuyerSafeEvidencePublishingTier tier, ProofPackageSendability sendability) =
            ResolveTier(deltas.IsDemoTenant, hardGapMessages, softGapMessages);

        return new PilotBuyerSafeEvidenceGateResult(tier, sendability, demoGaps, hardGapMessages, softGapMessages);
    }

    private static (PilotBuyerSafeEvidencePublishingTier Tier, ProofPackageSendability Sendability) ResolveTier(
        bool demoTenant,
        IReadOnlyList<string> hardGaps,
        IReadOnlyList<string> softGaps)
    {
        if (demoTenant || hardGaps.Count > 0)
            return (PilotBuyerSafeEvidencePublishingTier.DemoOnly, ProofPackageSendability.NotSendable);

        return softGaps.Count > 0 ? (PilotBuyerSafeEvidencePublishingTier.Partial, ProofPackageSendability.SendableWithCaveats) : (PilotBuyerSafeEvidencePublishingTier.Complete, ProofPackageSendability.Sendable);
    }
}
