using System.Globalization;
using System.Text;

using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Architecture;
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
        DateTime generatedUtc)
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
        AppendRunSummarySection(sb, detail, executiveSummary, topFindingTitles);
        AppendRoiBasisSection(sb, roiSummary);

        return sb.ToString().TrimEnd() + Environment.NewLine;
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
