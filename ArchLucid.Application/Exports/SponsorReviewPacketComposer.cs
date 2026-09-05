using System.Text;

using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Exports;

/// <summary>Composes a sponsor-facing sponsor review packet from run detail and ROI rollup inputs.</summary>
public static partial class SponsorReviewPacketComposer
{
    /// <summary>Builds deterministic Markdown for sponsor review exports (no LLM calls).</summary>
    public static string ComposeMarkdown(
        ArchitectureRunDetail detail,
        string SponsorReport,
        IReadOnlyList<string> topFindingTitles,
        SponsorRoiSummaryResponse roiSummary,
        DateTime generatedUtc,
        IReadOnlyList<SponsorReviewPacketDecisionRow>? topDecisions = null,
        SponsorReviewPacketPortfolioSignals? portfolioSignals = null,
        string? activeTrialExportNotice = null,
        SponsorReviewCoverageHonestyContext? coverageHonesty = null)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(SponsorReport);
        ArgumentNullException.ThrowIfNull(topFindingTitles);
        ArgumentNullException.ThrowIfNull(roiSummary);

        StringBuilder sb = new();

        sb.AppendLine("# Sponsor review packet");
        sb.AppendLine();
        sb.AppendLine($"**Generated (UTC):** {generatedUtc:yyyy-MM-dd HH:mm:ss} Z");

        ExportSafetyNoticeMarkdown.Append(sb, ResolveIsDemoTenant(detail), activeTrialExportNotice);
        sb.AppendLine();
        AppendManifestSummarySection(sb, detail);

        if (coverageHonesty is not null)
        {
            SponsorReviewCoverageHonestyMarkdownFormatter.AppendMarkdownSection(sb, coverageHonesty);
        }

        if (detail.Run is not null)
            SponsorExecutionModeMarkdownFormatter.AppendMarkdownSection(sb, detail.Run);

        AppendTopDecisionsSection(sb, topDecisions);
        AppendRunSummarySection(sb, detail, SponsorReport, topFindingTitles);
        AppendPortfolioSignalsSection(sb, portfolioSignals);
        AppendRoiBasisSection(sb, roiSummary);
        AppendSponsorArtifactEvidenceBadgeSection(sb, roiSummary, detail);
        AppendDispositionRoiBasisSection(sb, roiSummary);
        AppendRealizedValueSection(sb, roiSummary);

        return sb.ToString().TrimEnd() + Environment.NewLine;
    }

    private static bool ResolveIsDemoTenant(ArchitectureRunDetail detail) =>
        ContosoRetailDemoIdentifiers.IsDemoRunId(detail.Run?.RunId ?? string.Empty)
        || ContosoRetailDemoIdentifiers.IsDemoRequestId(detail.Run?.RequestId);
}
