using System.Globalization;
using System.Text;

using ArchLucid.Application.Exports;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>Sponsor first-page status table for the first-value report.</summary>
public static class FirstValueReportSponsorStatusSectionFormatter
{
    public static void AppendMarkdownSection(
        StringBuilder sb,
        ArchitectureRunDetail detail,
        SponsorSafeProofDisposition disposition,
        ProofPackageCompletenessResponse proof,
        PilotRunDeltas deltas,
        ArchitectureRun run,
        SponsorRoiClaimDispositionResult roiClaimGate)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(proof);
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(roiClaimGate);

        sb.AppendLine("## Sponsor first-page status");
        sb.AppendLine();
        sb.AppendLine(
            "Read this block before forwarding the packet. It summarizes the evidence basis, quality posture, ROI basis, top findings, deferred buyer requirements, and next action without adding new claims.");
        sb.AppendLine();
        sb.AppendLine("| Question | Sponsor-safe answer |");
        sb.AppendLine("| --- | --- |");
        sb.AppendLine($"| Evidence source | {FormatSponsorEvidenceSource(proof)} |");
        sb.AppendLine($"| Execution mode | {SponsorExecutionModeMarkdownFormatter.FormatSponsorFirstPageTableCell(run)} |");
        sb.AppendLine($"| Quality disposition | {FormatSponsorQualityDisposition(proof, deltas)} |");
        sb.AppendLine($"| ROI claim gate | {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(roiClaimGate.DispositionLeadLine)} |");
        sb.AppendLine($"| ROI basis status | {FormatSponsorRoiBasis(proof, roiClaimGate)} |");
        sb.AppendLine($"| LLM call basis | {FormatSponsorLlmCallBasis(deltas, proof)} |");
        sb.AppendLine($"| Audit row basis | {FormatSponsorAuditRowBasis(deltas, proof)} |");
        sb.AppendLine($"| Top findings | {FormatSponsorTopFindings(detail, deltas)} |");
        sb.AppendLine(
            $"| Semantic support | {FirstValueReportSemanticSupportBandSectionFormatter.FormatSponsorStatusTableCell(detail, deltas)} |");
        sb.AppendLine($"| Deferred buyer requirements | {FormatSponsorDeferredBuyerRequirements()} |");
        sb.AppendLine($"| Recommended next action | {FormatSponsorNextAction(disposition, proof, deltas, run)} |");
        sb.AppendLine();
    }

    private static string FormatSponsorEvidenceSource(ProofPackageCompletenessResponse proof) =>
        PilotDemoTenantDisciplineHonestyCopy.FormatSponsorFirstPageEvidenceSourceCell(proof);

    private static string FormatSponsorQualityDisposition(ProofPackageCompletenessResponse proof, PilotRunDeltas deltas) =>
        PilotAgentOutputPilotStrictHonestyCopy.FormatProofPackageCell(deltas);

    private static string FormatSponsorLlmCallBasis(PilotRunDeltas deltas, ProofPackageCompletenessResponse proof) =>
        PilotRunDeltasLlmCallCountFormatter.FormatProofPackageCell(deltas, proof);

    private static string FormatSponsorAuditRowBasis(PilotRunDeltas deltas, ProofPackageCompletenessResponse proof) =>
        PilotRunDeltasAuditRowCountFormatter.FormatProofPackageCell(deltas, proof);

    private static string FormatSponsorRoiBasis(
        ProofPackageCompletenessResponse proof,
        SponsorRoiClaimDispositionResult roiClaimGate)
    {
        string label = FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(FormatRoiConfidenceLabel(proof.RoiConfidenceLabel));
        string inputsSummary = proof.RoiBaselineInputs is null
            ? string.Empty
            : $" Per-field inputs: {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(PilotRoiBaselineInputsStatusResolver.FormatInputsSummary(proof.RoiBaselineInputs))}.";

        if (roiClaimGate.Disposition is SponsorRoiClaimDisposition.Pass
            && proof.RoiEvidenceConfidence is PilotRoiEvidenceConfidence.Strong
            && proof.RoiBaselineInputs?.ProjectedDollarClaimsSponsorSafe == true)
        {
            return PilotRoiEvidenceConfidenceHonestyCopy.EnsurePartialOrLowSponsorWording(
                proof.RoiEvidenceConfidence,
                $"**{proof.RoiEvidenceConfidence}** — {label}.{inputsSummary}");
        }

        string fallback = proof.RoiBaselineInputs?.SponsorSafeFallbackCopy.Length > 0
            ? FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(proof.RoiBaselineInputs.SponsorSafeFallbackCopy)
            : FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(roiClaimGate.NarrativeBlock);

        return PilotRoiEvidenceConfidenceHonestyCopy.EnsurePartialOrLowSponsorWording(
            proof.RoiEvidenceConfidence,
            $"**{proof.RoiEvidenceConfidence}** — {label}; {fallback}.{inputsSummary}");
    }

    private static string FormatSponsorTopFindings(ArchitectureRunDetail detail, PilotRunDeltas deltas)
    {
        List<ArchitectureFinding> materialFindings = PilotSponsorMaterialFindingsResolver.Resolve(detail, deltas)
            .Select(static (Finding, Index) => new { Finding, Index })
            .OrderByDescending(static f => f.Finding.Severity)
            .ThenBy(static f => f.Index)
            .Select(static f => f.Finding)
            .ToList();

        List<ArchitectureFinding> topFindings = materialFindings.Take(3).ToList();

        if (topFindings.Count == 0)
            return "No active findings recorded in this package.";

        string intro = PilotExportPreviewHonestyCopy.FormatCappedListIntro(
            topFindings.Count,
            materialFindings.Count,
            "top finding preview line(s)");

        return $"{intro}<br />{string.Join("<br />", topFindings.Select(FormatSponsorTopFindingLine))}";
    }

    private static string FormatSponsorTopFindingLine(ArchitectureFinding finding)
    {
        string severityLabel = FormatSponsorFindingSeverityLabel(finding);
        string message = string.IsNullOrWhiteSpace(finding.Message)
            ? SponsorReviewPacketExportHonestyCopy.FormatTopFindingTitle(finding)
            : TruncateSponsorFinding(finding.Message);

        return $"{severityLabel}: {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(message)}";
    }

    private static string FormatSponsorFindingSeverityLabel(ArchitectureFinding finding)
    {
        return finding.Severity switch
        {
            FindingSeverity.Info => "Info",
            FindingSeverity.Warning => "Warning",
            FindingSeverity.Error => "Error",
            FindingSeverity.Critical => "Critical",
            _ => PilotTopFindingPresentationHonestyCopy.SeverityNotStored,
        };
    }

    private static string FormatSponsorDeferredBuyerRequirements()
        => "SOC 2 CPA report, external third-party pen-test summary, public reference customer, and live commerce/Marketplace publication remain deferred scope; do not imply they exist.";

    private static string FormatSponsorNextAction(
        SponsorSafeProofDisposition disposition,
        ProofPackageCompletenessResponse proof,
        PilotRunDeltas deltas,
        ArchitectureRun run)
    {
        if (disposition == SponsorSafeProofDisposition.Sendable)
            return "Send sponsor packet after human redaction review and qualitative baseline confirmation.";

        if (proof.DemoTenantWarningRequired || deltas.IsDemoTenant)
            return "Use this only as a demo walkthrough; run the same path on buyer evidence before sponsor send.";

        if (!proof.AgentOutputPilotStrictEvidenceSatisfied || run.RealModeFellBackToSimulator)
            return "Hold sponsor send; resolve AI quality/simulator disclosure before forwarding.";

        return "Review caveats, collect missing ROI/evidence fields, then regenerate the packet.";
    }

    private static string TruncateSponsorFinding(string value)
    {
        return PilotExportPreviewHonestyCopy.FormatShortenedPreview(value, "Finding text was not stored.");
    }

    private static string FormatRoiConfidenceLabel(string? label)
    {
        return string.IsNullOrWhiteSpace(label) ? "ROI confidence label was not stored." : label.Trim();
    }
}
