using System.Globalization;
using System.Text;

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
            "**Operator posture:** This block is machine-read of stored facts — you still owe qualitative baseline rows, attachments, and redaction before sponsor send.");
        sb.AppendLine();

        sb.AppendLine("**Concrete gaps (automated)**");
        sb.AppendLine();

        foreach (string bullet in EnumerateConcreteGaps(disposition, proof, deltas, run))
            sb.AppendLine(CultureInfo.InvariantCulture, $"- {bullet}");

        sb.AppendLine();
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"**Gate mirrors (structured):** ProofSendability = **{gate.ProofSendability}** · Publishing tier = **{gate.PublishingTier}** · Evidence completeness = **{proof.EvidenceCompleteness}**.");
        sb.AppendLine();
        sb.AppendLine(
            disposition == SponsorSafeProofDisposition.Sendable
                ? "**Sendability note:** Structural sponsor-blocking checks are green — simulator substitution and qualitative baselines elsewhere still apply."
                : "**Sendability note:** Treat every exported number as provisional until reconciled gaps are cleared.");
        sb.AppendLine();
    }

    /// <summary>Maps buyer-safe artifacts to sponsor language without changing evaluator semantics.</summary>
    public static SponsorSafeProofDisposition ResolveDisposition(PilotBuyerSafeEvidenceGateResult gate)
    {
        ArgumentNullException.ThrowIfNull(gate);

        if (gate.PublishingTier is PilotBuyerSafeEvidencePublishingTier.DemoOnly ||
            gate.ProofSendability is ProofPackageSendability.NotSendable)
            return SponsorSafeProofDisposition.NotSponsorSafeYet;

        if (gate.ProofSendability is ProofPackageSendability.SendableWithCaveats)
            return SponsorSafeProofDisposition.NeedsOperatorReview;

        return SponsorSafeProofDisposition.Sendable;
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
            yield return
                "Demo or sample tenant scope — deltas are illustrative and must **not** be presented as verified customer ROI or procurement-safe proof.";

        if (!proof.SupportRunIdPresent)
            yield return "Support run id missing — this export cannot be anchored to a persisted architecture review identity.";

        if (!proof.CommittedManifestPresent || !proof.RunInCommittedStatus)
            yield return "No committed golden manifest or run is not Committed — there is nothing sponsor-complete to ship yet.";

        if (proof is { CommittedManifestPresent: true, CommittedManifestTimestampResolved: false })
            yield return "Committed manifest timestamp is default/absent — commit-time proof cannot be audited from metadata.";

        if (proof is { CommittedManifestPresent: true, TimeToCommittedManifestResolved: false })
            yield return "Time-to-committed-manifest is unresolved — wall-clock throughput claims are unsubstantiated.";

        if (!proof.ArtifactDescriptorCountResolved)
            yield return "Artifact descriptor inventory did not resolve — package completeness cannot be attested.";

        if (!proof.TopFindingEvidenceChainPresentOrNotApplicable && deltas.TopFindingId is not null)
            yield return "Top finding has **no resolved evidence-chain pointer** — sponsors cannot reconstruct the decision fingerprint.";

        if (!proof.AuditRowsPresentOrLowerBound)
            yield return "Scoped audit-event count for this run is **zero** — durable audit continuity is not demonstrated.";

        if (!proof.LlmCallCountResolved)
            yield return "**LLM-call count is unattested** (trace/query failure) — the displayed integer is not trustworthy evidence.";

        if (!proof.AgentOutputPilotStrictEvidenceSatisfied)
            yield return "PilotStrict agent-output quality gate failed — do not circulate sponsor-grade real-mode assertions until traces read clean.";

        if (proof.RoiEvidenceConfidence is PilotRoiEvidenceConfidence.Partial or PilotRoiEvidenceConfidence.Low)
            yield return "**Tenant comparative baseline is incomplete or defaulted** — keep sponsor wording qualitative and avoid bespoke dollar narratives.";

        if (run.RealModeFellBackToSimulator)
            yield return "**Simulator substitution is recorded on the run** — disclose before any sponsor conversation implies live-model spend or production agent execution.";

        if (disposition == SponsorSafeProofDisposition.Sendable)
            yield return "No remaining automated sponsor-blocking checks — structured gate detail is spelled out later; still reconcile qualitative baselines.";
    }

    private static string DescribeDisposition(SponsorSafeProofDisposition d) => d switch
    {
        SponsorSafeProofDisposition.Sendable => "Sendable",
        SponsorSafeProofDisposition.NeedsOperatorReview => "Needs operator review",
        SponsorSafeProofDisposition.NotSponsorSafeYet => "Not sponsor-safe yet",
        _ => throw new ArgumentOutOfRangeException(nameof(d), d, null)
    };
}
