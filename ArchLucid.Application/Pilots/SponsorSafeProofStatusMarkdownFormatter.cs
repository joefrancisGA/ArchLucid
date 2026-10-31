using System.Globalization;
using System.Text;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Blunt headline block derived from <see cref="PilotBuyerSafeEvidenceGateEvaluator"/> and
///     <see cref="PilotProofPackageCompletenessMapper"/> — no parallel scoring logic.
/// </summary>
public static class SponsorSafeProofStatusMarkdownFormatter
{
    /// <summary>Places the section immediately after the report preface so PDF (Markdown-rendered) includes the same prose.</summary>
    public static void AppendMarkdownSection(
        StringBuilder sb,
        SponsorSafeProofDisposition disposition,
        PilotBuyerSafeEvidenceGateResult gate,
        ProofPackageCompletenessResponse proof,
        PilotRunDeltas deltas,
        ArchitectureRun run,
        GoldenManifest? manifest = null,
        SponsorRoiClaimDispositionResult? roiClaimGate = null)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(gate);
        ArgumentNullException.ThrowIfNull(proof);
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(run);

        sb.AppendLine("## Sponsor-safe proof status");
        sb.AppendLine();
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"**Verdict:** **{DescribeDisposition(disposition)}** — derived only from persisted run proofs, tenant value-window posture, and the buyer-safe gate.");
        sb.AppendLine();
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"**Structural execution mode:** {SponsorExecutionModeMarkdownFormatter.FormatSponsorExecutionMode(run)}");
        sb.AppendLine();

        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"**Sponsor-proof readiness:** {SponsorProofReadinessClassifier.FormatMarkdownTableCell(deltas, gate, proof.SponsorProofReadiness)}");

        sb.AppendLine();
        sb.AppendLine(
            "**Operator posture:** This block is machine-read of stored facts — you still owe qualitative baseline rows, attachments, and redaction before sponsor send.");
        sb.AppendLine();

        sb.AppendLine("**Concrete gaps (automated)**");
        sb.AppendLine();

        foreach (string bullet in EnumerateConcreteGaps(disposition, proof, deltas, run, manifest, roiClaimGate))
            sb.AppendLine(CultureInfo.InvariantCulture, $"- {bullet}");

        sb.AppendLine();
        sb.AppendLine(PilotSponsorSafeSendableAllClearHonestyCopy.FormatGateMirrorsStructuredMarkdownLine(proof));
        sb.AppendLine();
        sb.AppendLine(
            disposition == SponsorSafeProofDisposition.Sendable
                ? PilotSponsorSafeSendableAllClearHonestyCopy.FormatSendabilityNoteWhenSendable()
                : PilotSponsorSafeSendableAllClearHonestyCopy.FormatSendabilityNoteWhenNotSendable());
        sb.AppendLine();
    }

    /// <summary>Maps buyer-safe artifacts to sponsor language without changing evaluator semantics.</summary>
    public static SponsorSafeProofDisposition ResolveDisposition(PilotBuyerSafeEvidenceGateResult gate)
    {
        ArgumentNullException.ThrowIfNull(gate);

        if (gate.PublishingTier is PilotBuyerSafeEvidencePublishingTier.DemoOnly ||
            gate.ProofSendability is ProofPackageSendability.NotSendable)
            return SponsorSafeProofDisposition.NotSponsorSafeYet;

        return gate.ProofSendability is ProofPackageSendability.SendableWithCaveats ? SponsorSafeProofDisposition.NeedsOperatorReview : SponsorSafeProofDisposition.Sendable;
    }

    internal static IEnumerable<string> EnumerateConcreteGapsEnumerable(
        SponsorSafeProofDisposition disposition,
        ProofPackageCompletenessResponse proof,
        PilotRunDeltas deltas,
        ArchitectureRun run,
        GoldenManifest? manifest = null,
        SponsorRoiClaimDispositionResult? roiClaimGate = null) =>
        EnumerateConcreteGaps(disposition, proof, deltas, run, manifest, roiClaimGate);

    private static IEnumerable<string> EnumerateConcreteGaps(
        SponsorSafeProofDisposition disposition,
        ProofPackageCompletenessResponse proof,
        PilotRunDeltas deltas,
        ArchitectureRun run,
        GoldenManifest? manifest,
        SponsorRoiClaimDispositionResult? roiClaimGate = null)
    {
        if (deltas.IsDemoTenant || proof.DemoTenantWarningRequired)
            yield return PilotDemoTenantDisciplineHonestyCopy.FormatSponsorSafeConcreteGapLine();

        if (string.IsNullOrWhiteSpace(run.RunId))
            yield return PilotSupportRunIdHonestyCopy.FormatSponsorSafeConcreteGapLine();

        if (!PilotSponsorCommittedPosture.HasCompleteCommittedPosture(run, manifest))
            yield return PilotCommittedManifestStatusHonestyCopy.FormatSponsorSafeConcreteGapLine();

        if (manifest is not null && manifest.Metadata.CreatedUtc == default)
            yield return PilotCommittedManifestTimestampHonestyCopy.FormatSponsorSafeConcreteGapLine();

        if (PilotSponsorCommittedPosture.HasCompleteCommittedPosture(run, manifest)
            && deltas.TimeToCommittedManifest is null)
            yield return PilotRunDeltasTimeToCommitFormatter.FormatSponsorSafeConcreteGapLineWhenUnresolved();

        if (PilotSponsorCommittedPosture.HasCompleteCommittedPosture(run, manifest)
            && !deltas.SynthesizedArtifactDescriptorCountResolved)
            yield return PilotArtifactDescriptorCountHonestyCopy.FormatSponsorSafeConcreteGapLine();

        if (deltas.TopFindingId is not null && deltas.TopFindingEvidenceChain is null)
            yield return PilotTopFindingEvidenceChainHonestyCopy.FormatSponsorSafeConcreteGapLineWhenUnavailable();

        if (!deltas.AuditRowCountResolved)
            yield return PilotRunDeltasAuditRowCountFormatter.FormatSponsorSafeConcreteGapLineWhenUnresolved();
        else if (deltas is { AuditRowCountResolved: true, AuditRowCount: 0, AuditRowCountTruncated: false })
            yield return PilotRunDeltasAuditRowCountFormatter.FormatSponsorSafeConcreteGapLineWhenZero();

        if (!deltas.LlmCallCountResolved)
            yield return PilotRunDeltasLlmCallCountFormatter.FormatSponsorSafeConcreteGapLine();

        if (!deltas.AgentOutputPilotStrictSignalsResolved)
            yield return PilotAgentOutputPilotStrictHonestyCopy.FormatSponsorSafeConcreteGapLineWhenUnresolved();
        else if (deltas.AgentOutputPilotStrictViolatesSponsorEvidence)
            yield return PilotAgentOutputPilotStrictHonestyCopy.FormatSponsorSafeConcreteGapLine();

        PilotRoiEvidenceConfidence roiEvidenceConfidence = roiClaimGate?.EvidenceConfidence ?? proof.RoiEvidenceConfidence;

        if (roiEvidenceConfidence is PilotRoiEvidenceConfidence.Partial or PilotRoiEvidenceConfidence.Low)
            yield return SponsorProofReadinessClassifier.FormatComparativeBaselineBuyerSafeGateSoftGapLine();

        if (roiEvidenceConfidence is PilotRoiEvidenceConfidence.Partial or PilotRoiEvidenceConfidence.Low)
            yield return PilotRoiEvidenceConfidenceHonestyCopy.FormatSponsorSafeConcreteGapLineWhenPartialOrLow();

        if (!deltas.IsDemoTenant)
        {
            bool projectedDollarClaimsSponsorSafe = roiClaimGate?.ProjectedDollarClaimsSponsorSafe
                ?? proof.RoiBaselineInputs?.ProjectedDollarClaimsSponsorSafe == true;

            if (!projectedDollarClaimsSponsorSafe)
                yield return PilotProjectedDollarClaimsSponsorSafeHonestyCopy.FormatSponsorSafeConcreteGapLine();
        }

        if (run.RealModeFellBackToSimulator)
            yield return PilotSimulatorSubstitutionHonestyCopy.FormatSponsorSafeConcreteGapLine();

        if (disposition == SponsorSafeProofDisposition.Sendable)
            yield return PilotSponsorSafeSendableAllClearHonestyCopy.FormatSponsorSafeConcreteGapLine();
    }

    private static string DescribeDisposition(SponsorSafeProofDisposition d) => d switch
    {
        SponsorSafeProofDisposition.Sendable => "Sendable",
        SponsorSafeProofDisposition.NeedsOperatorReview => "Needs operator review",
        SponsorSafeProofDisposition.NotSponsorSafeYet => "Not sponsor-safe yet",
        _ => throw new ArgumentOutOfRangeException(nameof(d), d, null)
    };
}
