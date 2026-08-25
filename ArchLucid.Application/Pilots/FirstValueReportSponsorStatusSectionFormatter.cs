using System.Globalization;
using System.Text;

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
        sb.AppendLine($"| Execution mode | {SponsorExecutionModeMarkdownFormatter.FormatSponsorExecutionMode(run)} |");
        sb.AppendLine($"| Quality disposition | {FormatSponsorQualityDisposition(proof)} |");
        sb.AppendLine($"| ROI claim gate | {roiClaimGate.DispositionLeadLine} |");
        sb.AppendLine($"| ROI basis status | {FormatSponsorRoiBasis(proof, roiClaimGate)} |");
        sb.AppendLine($"| LLM call basis | {FormatSponsorLlmCallBasis(deltas, proof)} |");
        sb.AppendLine($"| Top findings | {FormatSponsorTopFindings(detail, deltas)} |");
        sb.AppendLine($"| Deferred buyer requirements | {FormatSponsorDeferredBuyerRequirements()} |");
        sb.AppendLine($"| Recommended next action | {FormatSponsorNextAction(disposition, proof, deltas, run)} |");
        sb.AppendLine();
    }

    private static string FormatSponsorEvidenceSource(ProofPackageCompletenessResponse proof)
    {
        if (proof.DemoTenantWarningRequired)
            return "**Demo-derived** — illustrative sample output; do not present as buyer outcome.";

        return proof.BuyerSafeRedactionProfile.Length > 0
            ? $"**{FirstValueReportMarkdownFormatting.EscapeMarkdownTableCell(proof.BuyerSafeRedactionProfile)}** — tenant-scoped persisted proof fields."
            : "**Tenant evidence** — persisted proof fields available; redaction profile not labeled.";
    }

    private static string FormatSponsorQualityDisposition(ProofPackageCompletenessResponse proof)
    {
        return proof.AgentOutputPilotStrictEvidenceSatisfied
            ? "PilotStrict posture satisfied — no rejecting trace/faithfulness signals attested for this run."
            : "**HOLD** — PilotStrict posture failed; do not use sponsor-safe real-mode wording yet.";
    }

    private static string FormatSponsorLlmCallBasis(PilotRunDeltas deltas, ProofPackageCompletenessResponse proof)
    {
        if (!proof.LlmCallCountResolved)
            return "**Not attested** — execution trace query failed; do not cite an LLM call count.";

        return $"**{deltas.LlmCallCount.ToString(CultureInfo.InvariantCulture)}** trace row(s) for this run (zero may be valid when simulator substitution applies — see quality disposition).";
    }

    private static string FormatSponsorRoiBasis(
        ProofPackageCompletenessResponse proof,
        SponsorRoiClaimDispositionResult roiClaimGate)
    {
        string label = FirstValueReportMarkdownFormatting.EscapeMarkdownTableCell(proof.RoiConfidenceLabel);
        string inputsSummary = proof.RoiBaselineInputs is null
            ? string.Empty
            : $" Per-field inputs: {FirstValueReportMarkdownFormatting.EscapeMarkdownTableCell(PilotRoiBaselineInputsStatusResolver.FormatInputsSummary(proof.RoiBaselineInputs))}.";

        if (roiClaimGate.Disposition is SponsorRoiClaimDisposition.Pass
            && proof.RoiEvidenceConfidence is PilotRoiEvidenceConfidence.Strong
            && proof.RoiBaselineInputs?.ProjectedDollarClaimsSponsorSafe == true)
            return $"**{proof.RoiEvidenceConfidence}** — {label}.{inputsSummary}";

        string fallback = proof.RoiBaselineInputs?.SponsorSafeFallbackCopy.Length > 0
            ? FirstValueReportMarkdownFormatting.EscapeMarkdownTableCell(proof.RoiBaselineInputs.SponsorSafeFallbackCopy)
            : roiClaimGate.NarrativeBlock;

        return $"**{proof.RoiEvidenceConfidence}** — {label}; {fallback}.{inputsSummary}";
    }

    private static string FormatSponsorTopFindings(ArchitectureRunDetail detail, PilotRunDeltas deltas)
    {
        List<ArchitectureFinding> topFindings = PilotSponsorMaterialFindingsResolver.Resolve(detail, deltas)
            .Select(static (Finding, Index) => new { Finding, Index })
            .OrderByDescending(static f => f.Finding.Severity)
            .ThenBy(static f => f.Index)
            .Take(3)
            .Select(static f => f.Finding)
            .ToList();

        if (topFindings.Count == 0)
            return "No active findings recorded in this package.";

        return string.Join(
            "<br />",
            topFindings.Select(static f => $"{f.Severity}: {FirstValueReportMarkdownFormatting.EscapeMarkdownTableCell(TruncateSponsorFinding(f.Message))}"));
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
        string trimmed = value.Trim();

        if (trimmed.Length <= 96)
            return trimmed;

        return string.Concat(trimmed.AsSpan(0, 93), "...");
    }
}
