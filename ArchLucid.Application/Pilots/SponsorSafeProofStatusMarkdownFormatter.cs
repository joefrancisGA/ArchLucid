using System.Globalization;
using System.Text;

using ArchLucid.Application.Runs;
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
        ArchitectureRun run)
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

        if (Enum.TryParse(proof.SponsorProofReadiness, ignoreCase: false, out SponsorProofReadinessClassification sponsorReadiness))
        {
            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"**Sponsor-proof readiness:** {SponsorProofReadinessClassifier.DescribeForMarkdownTable(sponsorReadiness)}");
        }
        else
        {
            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"**Sponsor-proof readiness:** {PilotSponsorProofReadinessUnresolvedHonestyCopy.FormatSponsorSafeStatusSectionLine()}");
        }

        sb.AppendLine();
        sb.AppendLine(
            "**Operator posture:** This block is machine-read of stored facts — you still owe qualitative baseline rows, attachments, and redaction before sponsor send.");
        sb.AppendLine();

        sb.AppendLine("**Concrete gaps (automated)**");
        sb.AppendLine();

        foreach (string bullet in EnumerateConcreteGaps(disposition, proof, deltas, run))
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
        ArchitectureRun run) => EnumerateConcreteGaps(disposition, proof, deltas, run);

    private static IEnumerable<string> EnumerateConcreteGaps(
        SponsorSafeProofDisposition disposition,
        ProofPackageCompletenessResponse proof,
        PilotRunDeltas deltas,
        ArchitectureRun run)
    {
        if (proof.DemoTenantWarningRequired)
            yield return PilotDemoTenantDisciplineHonestyCopy.FormatSponsorSafeConcreteGapLine();

        if (!proof.SupportRunIdPresent)
            yield return PilotSupportRunIdHonestyCopy.FormatSponsorSafeConcreteGapLine();

        if (!proof.CommittedManifestPresent || !proof.RunInCommittedStatus)
            yield return PilotCommittedManifestStatusHonestyCopy.FormatSponsorSafeConcreteGapLine();

        if (proof is { CommittedManifestPresent: true, CommittedManifestTimestampResolved: false })
            yield return PilotCommittedManifestTimestampHonestyCopy.FormatSponsorSafeConcreteGapLine();

        if (proof is { CommittedManifestPresent: true, RunInCommittedStatus: true, TimeToCommittedManifestResolved: false })
            yield return PilotRunDeltasTimeToCommitFormatter.FormatSponsorSafeConcreteGapLineWhenUnresolved();

        if (proof is { CommittedManifestPresent: true, RunInCommittedStatus: true, ArtifactDescriptorCountResolved: false })
            yield return PilotArtifactDescriptorCountHonestyCopy.FormatSponsorSafeConcreteGapLine();

        if (!proof.TopFindingEvidenceChainPresentOrNotApplicable && deltas.TopFindingId is not null)
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

        if (proof.RoiEvidenceConfidence is PilotRoiEvidenceConfidence.Partial or PilotRoiEvidenceConfidence.Low)
            yield return SponsorProofReadinessClassifier.FormatComparativeBaselineBuyerSafeGateSoftGapLine();

        if (proof.RoiEvidenceConfidence is PilotRoiEvidenceConfidence.Partial or PilotRoiEvidenceConfidence.Low)
            yield return PilotRoiEvidenceConfidenceHonestyCopy.FormatSponsorSafeConcreteGapLineWhenPartialOrLow();

        if (!deltas.IsDemoTenant && proof.RoiBaselineInputs?.ProjectedDollarClaimsSponsorSafe != true)
            yield return PilotProjectedDollarClaimsSponsorSafeHonestyCopy.FormatSponsorSafeConcreteGapLine();

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
