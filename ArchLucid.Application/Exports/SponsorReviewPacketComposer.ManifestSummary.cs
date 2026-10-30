using System.Text;

using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Application.Manifests;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Exports;

public static partial class SponsorReviewPacketComposer
{
    private static void AppendManifestSummarySection(StringBuilder sb, ArchitectureRunDetail detail)
    {
        GoldenManifest? manifest = detail.Manifest;

        sb.AppendLine("## Manifest summary");
        sb.AppendLine();

        if (manifest is null)
        {
            sb.AppendLine($"- **Manifest:** {SponsorReviewPacketExportHonestyCopy.ManifestNotStored}");
            sb.AppendLine();
            return;
        }

        ArchitectureRun? run = detail.Run;
        string manifestVersion = manifest.Metadata?.ManifestVersion?.Trim() is { Length: > 0 } storedManifestVersion
            ? storedManifestVersion
            : "Manifest version was not stored.";
        string runId = run?.RunId?.Trim() is { Length: > 0 } storedRunId
            ? storedRunId
            : "Review ID was not stored.";
        string statusLabel = run is null
            ? "Review status was not stored."
            : run.Status == ArchitectureRunStatus.Committed
                ? "Committed"
                : run.Status.ToString();

        string systemName = ArchitectureManifestMarkdownSummaryExport.FormatSystemNameForSummary(manifest.SystemName);
        sb.AppendLine($"- **System:** {systemName}");
        sb.AppendLine($"- **Manifest version:** {manifestVersion}");
        sb.AppendLine($"- **Review ID:** `{runId}`");
        sb.AppendLine($"- **Status:** {statusLabel}");
        sb.AppendLine();
    }

    private static void AppendRunSummarySection(
        StringBuilder sb,
        ArchitectureRunDetail detail,
        string SponsorReport,
        IReadOnlyList<string> topFindingTitles)
    {
        RunSummaryOnePagerDocumentModel onePager =
            RunSummaryOnePagerDocumentFactory.Create(detail, SponsorReport, topFindingTitles);

        sb.AppendLine("## Review summary");
        sb.AppendLine();
        sb.AppendLine(RunSummaryOnePagerMarkdownRenderer.Render(onePager).TrimEnd());
        sb.AppendLine();
    }
}
