using System.Globalization;
using System.Text;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>Buyer-safe proof package contract section for the first-value report.</summary>
public static class FirstValueReportProofPackageSectionFormatter
{
    public static void AppendMarkdownSection(
        StringBuilder sb,
        PilotRunDeltas deltas,
        ProofPackageCompletenessResponse c,
        GoldenManifest? manifest,
        ArchitectureRun run)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(c);
        ArgumentNullException.ThrowIfNull(run);

        sb.AppendLine("## Buyer-safe proof package contract");
        sb.AppendLine();
        sb.AppendLine(
            "Use this section as the completeness check before sending the report to a sponsor. Persisted evidence is stronger than model narrative; missing rows should be called out rather than edited by hand.");
        sb.AppendLine();
        sb.AppendLine("| Required proof field | Status in this report |");
        sb.AppendLine("| --- | --- |");
        sb.AppendLine(
            $"| Non-demo / external-share discipline | {(c.DemoTenantWarningRequired ? "**FAILED — non-negotiable demo warning.** Replace seeded identifiers before any sponsor-facing circulation." : "Pass — operator identifiers only per loaded tenant scope.")} |");
        sb.AppendLine($"| Support run id | {FormatProofStatus(c.SupportRunIdPresent)} |");
        sb.AppendLine($"| Committed manifest + status | {FormatProofStatus(c is { CommittedManifestPresent: true, RunInCommittedStatus: true })} |");
        sb.AppendLine($"| Committed manifest timestamp (UTC) | {FormatCommittedManifestTimestampProofCell(deltas, c, manifest)} |");
        sb.AppendLine($"| Artifact descriptor count | {FormatArtifactDescriptorsProofCell(c)} |");
        sb.AppendLine($"| Time to committed manifest | {FormatProofStatus(c.TimeToCommittedManifestResolved)} |");
        sb.AppendLine($"| Findings by severity | {FormatProofStatus(c.FindingsBySeverityPresent)} |");
        sb.AppendLine($"| Top finding evidence-chain pointer | {FormatTopFindingEvidenceProofCell(deltas)} |");
        sb.AppendLine($"| Audit-row count or lower bound | {FormatProofStatus(c.AuditRowsPresentOrLowerBound)} |");
        sb.AppendLine($"| LLM-call count | {FormatLlmCallCountProofCell(deltas, c)} |");
        sb.AppendLine($"| ROI evidence confidence | **{c.RoiEvidenceConfidence}** — {c.RoiConfidenceLabel} |");

        if (c.RoiBaselineInputs is not null)
        {
            sb.AppendLine(
                $"| ROI baseline inputs (per field) | {FirstValueReportMarkdownFormatting.EscapeMarkdownTableCell(PilotRoiBaselineInputsStatusResolver.FormatInputsSummary(c.RoiBaselineInputs))} |");
            sb.AppendLine(
                $"| Projected dollar claims sponsor-safe | {(c.RoiBaselineInputs.ProjectedDollarClaimsSponsorSafe ? "Yes" : "**No** — do not lead with projected USD savings")} |");
        }

        sb.AppendLine($"| Buyer-safe redaction profile | {c.BuyerSafeRedactionProfile} |");
        sb.AppendLine(
            $"| PilotStrict agent-output posture | {(c.AgentOutputPilotStrictEvidenceSatisfied ? "Satisfied — no PilotStrict trace/faithfulness failures attested for this run." : "**FAILED** — PilotStrict quality gate reported rejecting signals; withhold sponsor-grade real-mode claims until traces pass.")} |");
        sb.AppendLine($"| Evidence-basis labels | {FormatEvidenceBasisLabels(c, deltas, run)} |");
        sb.AppendLine($"| Proof sendability (API mirror) | `{c.ProofSendability}` Â· `{c.PublishingTier}` Â· **{c.EvidenceCompleteness}** |");
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"| Sponsor-proof readiness (classification) | {(Enum.TryParse(c.SponsorProofReadiness, ignoreCase: false, out SponsorProofReadinessClassification readiness) ? SponsorProofReadinessClassifier.DescribeForMarkdownTable(readiness) : "**Incomplete** — classification unavailable.")} |");
        sb.AppendLine();
    }

    private static string FormatEvidenceBasisLabels(
        ProofPackageCompletenessResponse c,
        PilotRunDeltas deltas,
        ArchitectureRun run)
    {
        IReadOnlyList<string> labels = SponsorEvidenceBasisLabelResolver.ResolveLabels(c, deltas, run);
        return SponsorEvidenceBasisLabelResolver.FormatLabelsForMarkdownTable(labels);
    }

    private static string FormatArtifactDescriptorsProofCell(ProofPackageCompletenessResponse c)
    {
        return !c.ArtifactDescriptorCountResolved ? "Missing — committed architecture manifest id absent or synthesized artifact query failed (see audit/logs rather than guessing)." : $"Present — `{c.ArtifactDescriptorCount}` descriptor(s) for this committed architecture manifest.";
    }

    private static string FormatCommittedManifestTimestampProofCell(PilotRunDeltas deltas, ProofPackageCompletenessResponse c, GoldenManifest? manifest)
    {
        if (!c.CommittedManifestPresent)
            return "Missing — no committed architecture manifest on this run detail.";
        if (!c.CommittedManifestTimestampResolved)
            return "Missing — `GoldenManifest.Metadata.CreatedUtc` is default / not a real commit timestamp.";
        DateTime committedUtc = deltas.ManifestCommittedUtc ?? manifest!.Metadata.CreatedUtc;
        return $"Present — `{committedUtc:O}` (`GoldenManifest.Metadata.CreatedUtc`).";
    }

    private static string FormatTopFindingEvidenceProofCell(PilotRunDeltas deltas)
    {
        if (deltas.TopFindingId is null)
            return "Not applicable — no findings on this run.";
        return deltas.TopFindingEvidenceChain is not null ? "Present" : "Explicitly unavailable — persisted finding without resolvable evidence-chain pointers (see buyer-safe gate).";
    }

    private static string FormatLlmCallCountProofCell(PilotRunDeltas deltas, ProofPackageCompletenessResponse c)
    {
        return !c.LlmCallCountResolved ? "Missing — execution trace query failed; count is not attested." : $"`{deltas.LlmCallCount.ToString(CultureInfo.InvariantCulture)}` row(s) in execution traces (zero may still be valid — disclose simulator substitution separately when flagged above).";
    }

    private static string FormatProofStatus(bool present) => present ? "Present" : "Missing or not applicable; review before sponsor send";
}
