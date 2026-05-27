using System.Globalization;
using System.Text;

using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Exports;

/// <summary>Composes a sponsor-facing executive review packet from run detail and ROI rollup inputs.</summary>
public static class ExecutiveReviewPacketComposer
{
    /// <summary>Builds deterministic Markdown for executive review exports (no LLM calls).</summary>
    public static string ComposeMarkdown(
        ArchitectureRunDetail detail,
        string executiveSummary,
        IReadOnlyList<string> topFindingTitles,
        ExecutiveRoiSummaryResponse roiSummary,
        DateTime generatedUtc,
        IReadOnlyList<ExecutiveReviewPacketDecisionRow>? topDecisions = null,
        ExecutiveReviewPacketPortfolioSignals? portfolioSignals = null)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(executiveSummary);
        ArgumentNullException.ThrowIfNull(topFindingTitles);
        ArgumentNullException.ThrowIfNull(roiSummary);

        StringBuilder sb = new();

        sb.AppendLine("# Executive review packet");
        sb.AppendLine();
        sb.AppendLine($"**Generated (UTC):** {generatedUtc:yyyy-MM-dd HH:mm:ss} Z");
        sb.AppendLine();
        AppendManifestSummarySection(sb, detail);
        AppendTopDecisionsSection(sb, topDecisions);
        AppendRunSummarySection(sb, detail, executiveSummary, topFindingTitles);
        AppendPortfolioSignalsSection(sb, portfolioSignals);
        AppendRoiBasisSection(sb, roiSummary);

        return sb.ToString().TrimEnd() + Environment.NewLine;
    }

    private static void AppendTopDecisionsSection(StringBuilder sb, IReadOnlyList<ExecutiveReviewPacketDecisionRow>? topDecisions)
    {
        if (topDecisions is null || topDecisions.Count == 0)
            return;

        sb.AppendLine("## Top decisions");
        sb.AppendLine();

        foreach (ExecutiveReviewPacketDecisionRow decision in topDecisions.Take(5))
        {
            sb.AppendLine($"- **{decision.Title.Trim()}** — {decision.SelectedOption.Trim()}");

            if (!string.IsNullOrWhiteSpace(decision.ConfidenceLabel))
                sb.AppendLine($"  - Confidence: {decision.ConfidenceLabel.Trim()}");

            if (!string.IsNullOrWhiteSpace(decision.EvidenceHref))
                sb.AppendLine($"  - Evidence: {decision.EvidenceHref.Trim()}");
        }

        sb.AppendLine();
    }

    private static void AppendPortfolioSignalsSection(StringBuilder sb, ExecutiveReviewPacketPortfolioSignals? portfolioSignals)
    {
        if (portfolioSignals is null)
            return;

        sb.AppendLine("## Portfolio signals (live)");
        sb.AppendLine();
        sb.AppendLine(
            $"- **Findings resolved (30d):** {portfolioSignals.ResolvedFindingsCount30Days.ToString(CultureInfo.InvariantCulture)}");
        sb.AppendLine(
            $"- **Findings discovered (30d):** {portfolioSignals.NewlyDiscoveredFindingsCount30Days.ToString(CultureInfo.InvariantCulture)}");
        sb.AppendLine(
            $"- **Stale architecture risks:** {portfolioSignals.StaleRiskCount.ToString(CultureInfo.InvariantCulture)}");
        sb.AppendLine(
            $"- **Waivers expiring (14d):** {portfolioSignals.ExpiringWaiversCount14Days.ToString(CultureInfo.InvariantCulture)}");

        if (portfolioSignals.NextActions.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("### Next actions");

            foreach (string action in portfolioSignals.NextActions.Take(5))
            {
                if (!string.IsNullOrWhiteSpace(action))
                    sb.AppendLine($"- {action.Trim()}");
            }
        }

        sb.AppendLine();
    }

    private static void AppendManifestSummarySection(StringBuilder sb, ArchitectureRunDetail detail)
    {
        GoldenManifest? manifest = detail.Manifest;

        if (manifest is null)
            return;

        ArchitectureRun? run = detail.Run;
        string manifestVersion = manifest.Metadata?.ManifestVersion ?? "—";
        string runId = run?.RunId ?? "—";
        string statusLabel = run?.Status.ToString() ?? "—";

        sb.AppendLine("## Manifest summary");
        sb.AppendLine();
        sb.AppendLine($"- **System:** {manifest.SystemName}");
        sb.AppendLine($"- **Manifest version:** {manifestVersion}");
        sb.AppendLine($"- **Run:** `{runId}`");
        sb.AppendLine($"- **Status:** {statusLabel}");
        sb.AppendLine();
    }

    private static void AppendRunSummarySection(
        StringBuilder sb,
        ArchitectureRunDetail detail,
        string executiveSummary,
        IReadOnlyList<string> topFindingTitles)
    {
        RunSummaryOnePagerDocumentModel onePager =
            RunSummaryOnePagerDocumentFactory.Create(detail, executiveSummary, topFindingTitles);

        sb.AppendLine("## Run summary");
        sb.AppendLine();
        sb.AppendLine(RunSummaryOnePagerMarkdownRenderer.Render(onePager).TrimEnd());
        sb.AppendLine();
    }

    private static void AppendRoiBasisSection(StringBuilder sb, ExecutiveRoiSummaryResponse roiSummary)
    {
        sb.AppendLine("## ROI basis");
        sb.AppendLine();
        sb.AppendLine($"**Savings pricing basis:** {roiSummary.SavingsPricingBasis}");
        sb.AppendLine(
            $"**EA discount multiplier:** {roiSummary.EaDiscountMultiplier.ToString("0.####", CultureInfo.InvariantCulture)}");

        if (!string.IsNullOrWhiteSpace(roiSummary.SavingsPricingBasisDescription))
            sb.AppendLine($"**Pricing basis note:** {roiSummary.SavingsPricingBasisDescription.Trim()}");

        if (!string.IsNullOrWhiteSpace(roiSummary.CostEvidenceFreshnessStatus))
        {
            sb.AppendLine(
                $"**Cost evidence freshness:** {roiSummary.CostEvidenceFreshnessStatus} (stale after {roiSummary.CostEvidenceStaleAfterDays.ToString(CultureInfo.InvariantCulture)} days)");
        }

        sb.AppendLine(
            $"**Estimated savings (USD):** {roiSummary.TotalEstimatedUsdSavings.ToString("N2", CultureInfo.InvariantCulture)}");
    }
}
