using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Maps persisted proof fields to explanation evidence-basis labels in
///     <c>docs/library/AGENT_OUTPUT_EVALUATION.md</c> — labeling only, not legal attestation.
/// </summary>
public static class SponsorEvidenceBasisLabelResolver
{
    public static IReadOnlyList<string> ResolveLabels(
        ProofPackageCompletenessResponse proof,
        PilotRunDeltas deltas,
        ArchitectureRun run,
        bool deferredScopePresent = false)
    {
        ArgumentNullException.ThrowIfNull(proof);
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(run);

        List<string> labels = [];

        if (deferredScopePresent)
            labels.Add("Deferred scope");

        if (proof.DemoTenantWarningRequired || deltas.IsDemoTenant)
            labels.Add("Demo-derived");

        if (!proof.AgentOutputPilotStrictEvidenceSatisfied)
            labels.Add("Low support");

        if (proof.RoiEvidenceConfidence is PilotRoiEvidenceConfidence.Partial or PilotRoiEvidenceConfidence.Low)
            labels.Add("Estimate");

        if (run.RealModeFellBackToSimulator)
            labels.Add("Manual review required");

        if (labels.Count == 0)
            labels.Add("Evidence-backed");

        return labels;
    }

    public static string FormatLabelsForMarkdownTable(IReadOnlyList<string> labels)
    {
        ArgumentNullException.ThrowIfNull(labels);

        if (labels.Count == 0)
            return "**Unknown**";

        return string.Join(" · ", labels.Select(static label => $"**{label}**"));
    }

    public static string DescribeVerdict(IReadOnlyList<string> labels)
    {
        ArgumentNullException.ThrowIfNull(labels);

        if (labels.Contains("Deferred scope", StringComparer.Ordinal))
        {
            return
                "**Deferred scope** — one or more buyer asks are outside V1 readiness; treat this export as illustrative for those topics only.";
        }

        if (labels.Contains("Demo-derived", StringComparer.Ordinal))
        {
            return
                "**Demo-derived** — illustrative sample-tenant output only; do not quote as verified customer ROI or procurement-safe proof.";
        }

        if (labels.Contains("Low support", StringComparer.Ordinal)
            || labels.Contains("Manual review required", StringComparer.Ordinal))
        {
            return
                "**Manual review required** — AI or simulator posture is not sponsor-grade without human reconciliation; do not treat narrative as fully evidence-backed.";
        }

        if (labels.Contains("Estimate", StringComparer.Ordinal))
        {
            return
                "**Estimate-heavy** — structural proofs may be present, but ROI or baseline fields rely on defaults or partial measurement; disclose before dollar claims.";
        }

        return
            "**Evidence-backed** — persisted citations and proof-package checks support sponsor review; humans still approve final decisions.";
    }
}
