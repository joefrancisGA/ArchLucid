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
            demoGaps.Add("Seeded/demo tenant — replace before external sponsor screenshots or purchase narratives.");

        List<string> hardGapMessages = [];

        if (manifest is null || run.Status != ArchitectureRunStatus.Committed)
        {
            hardGapMessages.Add(
                "Committed golden manifest absent or run not in Committed status — finalize before external sponsor distribution.");
        }

        if (deltas.AuditRowCount == 0)
        {
            hardGapMessages.Add(
                "Scoped audit-event query returned zero rows — confirm tenancy scope and audit continuity for this run.");
        }

        if (deltas.AgentOutputPilotStrictSignalsResolved && deltas.AgentOutputPilotStrictViolatesSponsorEvidence)
        {
            hardGapMessages.Add(
                "PilotStrict agent output quality posture failed for one or more LLM traces (or aggregate explanation faithfulness) — do not circulate this run as sponsor-grade real-mode evidence until traces are green.");
        }

        List<string> softGapMessages = [];

        if (run.RealModeFellBackToSimulator)
        {
            softGapMessages.Add(
                "Run recorded **simulator substitution** — disclose when claiming real LLM / production agent evidence.");
        }

        if (deltas.TopFindingId is not null && deltas.TopFindingEvidenceChain is null)
        {
            softGapMessages.Add(
                "Top-severity finding present but evidence-chain pointers did not resolve — verify full run detail JSON before sponsor send.");
        }

        if (!deltas.LlmCallCountResolved)
        {
            softGapMessages.Add(
                "LLM / agent execution trace count **not attested** — persistence or scope query failed; do not treat a zero value as proof of no calls.");
        }

        ReviewCycleBaselineProvenance prov = valueWindowSnapshot.ReviewCycleBaselineProvenance;

        if (prov is ReviewCycleBaselineProvenance.NoMeasurementYet or ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions)
        {
            softGapMessages.Add(
                "ROI comparative narrative uses **partial / default** baseline posture (see **ROI evidence completeness** section) — avoid customer-specific dollar claims.");
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

        if (softGaps.Count > 0)
            return (PilotBuyerSafeEvidencePublishingTier.Partial, ProofPackageSendability.SendableWithCaveats);

        return (PilotBuyerSafeEvidencePublishingTier.Complete, ProofPackageSendability.Sendable);
    }
}
