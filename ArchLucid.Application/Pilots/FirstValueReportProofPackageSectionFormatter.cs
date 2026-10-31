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
            $"| Non-demo / external-share discipline | {PilotDemoTenantDisciplineHonestyCopy.FormatProofPackageCell(c.DemoTenantWarningRequired)} |");
        sb.AppendLine($"| Support run id | {PilotSupportRunIdHonestyCopy.FormatProofPackageCell(c.SupportRunIdPresent)} |");
        sb.AppendLine($"| Committed manifest + status | {PilotCommittedManifestStatusHonestyCopy.FormatProofPackageCell(c)} |");
        sb.AppendLine($"| Committed manifest timestamp (UTC) | {PilotCommittedManifestTimestampHonestyCopy.FormatProofPackageCell(deltas, c, manifest)} |");
        sb.AppendLine($"| Artifact descriptor count | {PilotArtifactDescriptorCountHonestyCopy.FormatProofPackageCell(c)} |");
        sb.AppendLine($"| Time to committed manifest | {FormatTimeToCommittedManifestProofCell(deltas, c)} |");
        sb.AppendLine($"| Findings by severity | {FormatFindingsBySeverityProofCell(deltas)} |");
        sb.AppendLine($"| Top finding evidence-chain pointer | {FormatTopFindingEvidenceProofCell(deltas)} |");
        sb.AppendLine($"| Audit-row count or lower bound | {FormatAuditRowsProofCell(deltas, c)} |");
        sb.AppendLine($"| LLM-call count | {FormatLlmCallCountProofCell(deltas, c)} |");
        sb.AppendLine($"| ROI evidence confidence | **{c.RoiEvidenceConfidence}** — {FormatRoiConfidenceLabel(c.RoiConfidenceLabel)} |");

        if (c.RoiBaselineInputs is not null)
        {
            sb.AppendLine(
                $"| ROI baseline inputs (per field) | {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(PilotRoiBaselineInputsStatusResolver.FormatInputsSummary(c.RoiBaselineInputs))} |");
            sb.AppendLine(
                $"| Projected dollar claims sponsor-safe | {(c.RoiBaselineInputs.ProjectedDollarClaimsSponsorSafe ? "Yes" : "**No** — do not lead with projected USD savings")} |");
        }

        sb.AppendLine($"| Buyer-safe redaction profile | {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(c.BuyerSafeRedactionProfile)} |");
        sb.AppendLine(
            $"| PilotStrict agent-output posture | {(c.AgentOutputPilotStrictEvidenceSatisfied ? "Satisfied — no PilotStrict trace/faithfulness failures attested for this run." : "**FAILED** — PilotStrict quality gate reported rejecting signals; withhold sponsor-grade real-mode claims until traces pass.")} |");
        sb.AppendLine($"| Evidence-basis labels | {FormatEvidenceBasisLabels(c, deltas, run)} |");
        sb.AppendLine(
            $"| Proof sendability (API mirror) | {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(c.ProofSendability ?? string.Empty)} · {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(c.PublishingTier ?? string.Empty)} · {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(c.EvidenceCompleteness ?? string.Empty)} |");
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

    private static string FormatTimeToCommittedManifestProofCell(
        PilotRunDeltas deltas,
        ProofPackageCompletenessResponse c)
    {
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(c);

        if (c.TimeToCommittedManifestResolved)
        {
            return PilotRunDeltasTimeToCommitFormatter.FormatMarkdownTableCell(deltas);
        }

        return PilotRunDeltasTimeToCommitFormatter.NoCommittedManifestWallClockPlain;
    }

    private static string FormatFindingsBySeverityProofCell(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        return PilotRunDeltasFindingsBySeverityPlainTextFormatter.FormatMarkdownProofPackageCell(deltas);
    }

    private static string FormatAuditRowsProofCell(PilotRunDeltas deltas, ProofPackageCompletenessResponse c)
    {
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(c);

        return PilotRunDeltasAuditRowCountFormatter.FormatMarkdownTableCell(deltas);
    }

    private static string FormatTopFindingEvidenceProofCell(PilotRunDeltas deltas) =>
        PilotTopFindingEvidenceChainHonestyCopy.FormatMarkdownProofPackageCell(deltas);

    private static string FormatLlmCallCountProofCell(PilotRunDeltas deltas, ProofPackageCompletenessResponse c)
    {
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(c);

        if (!deltas.LlmCallCountResolved)
        {
            return PilotRunDeltasLlmCallCountFormatter.FormatMarkdownTableCell(deltas);
        }

        string countDisplay =
            FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(deltas.LlmCallCount.ToString(CultureInfo.InvariantCulture));

        if (deltas.LlmCallCount == 0)
        {
            return
                $"{countDisplay} row(s) in execution traces ({PilotRunDeltasLlmCallCountFormatter.ZeroSimulatorCaveatPlain}).";
        }

        return $"{countDisplay} row(s) in execution traces.";
    }

    private static string FormatProofStatus(bool present) => present ? "Present" : "Not present on this run.";

    private static string FormatRoiConfidenceLabel(string? label)
    {
        return string.IsNullOrWhiteSpace(label)
            ? "ROI confidence label was not stored."
            : FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(label.Trim());
    }
}
