using System.Globalization;
using System.Text;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Pilots;

/// <summary>Architecture review identity section for the first-value report.</summary>
public static class FirstValueReportRunSectionFormatter
{
    public static void AppendMarkdownSection(StringBuilder sb, ArchitectureRun run, GoldenManifest? manifest, string baseUrl)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(baseUrl);

        sb.AppendLine("## Architecture review identity");
        sb.AppendLine();
        sb.AppendLine(
            "Each architecture review is tracked as one run for support, API access, and traceability. Use the review package language with sponsors; keep the run id in support notes.");
        sb.AppendLine();
        sb.AppendLine("| Field | Value |");
        sb.AppendLine("| --- | --- |");
        sb.AppendLine($"| Support run id | `{run.RunId}` |");
        sb.AppendLine($"| Status | `{run.Status}` |");
        sb.AppendLine(
            $"| Request id | `{(string.IsNullOrWhiteSpace(run.RequestId) ? "Request id was not stored." : FirstValueReportMarkdownFormatting.EscapeMarkdownTableCell(run.RequestId.Trim()))}` |");
        sb.AppendLine($"| Created (UTC) | `{run.CreatedUtc:O}` |");
        sb.AppendLine(
            $"| Completed (UTC) | `{(run.CompletedUtc is null ? "Completed time was not stored." : run.CompletedUtc.Value.ToString("O", CultureInfo.InvariantCulture))}` |");
        if (manifest is null)
        {
            sb.AppendLine("| Committed manifest | Committed manifest was not stored. |");
            sb.AppendLine();
            return;
        }

        sb.AppendLine(
            $"| System | `{(string.IsNullOrWhiteSpace(manifest.SystemName) ? "System name was not stored." : FirstValueReportMarkdownFormatting.EscapeMarkdownTableCell(manifest.SystemName.Trim()))}` |");
        sb.AppendLine(
            $"| Manifest version | `{(string.IsNullOrWhiteSpace(manifest.Metadata.ManifestVersion) ? "Manifest version was not stored." : FirstValueReportMarkdownFormatting.EscapeMarkdownTableCell(manifest.Metadata.ManifestVersion.Trim()))}` |");
        sb.AppendLine($"| Commit snapshot (UTC) | `{manifest.Metadata.CreatedUtc:O}` |");
        sb.AppendLine("| Environment (capture) | Environment was not stored. |");
        sb.AppendLine();
        sb.AppendLine("### Evidence links");
        sb.AppendLine();
        if (!PilotExportLinkHonestyCopy.IsReviewLinkBaseStored(baseUrl))
        {
            sb.AppendLine($"- Run detail JSON — {PilotExportLinkHonestyCopy.ReviewLinkBaseNotStored} (`GET /v1/architecture/review/{{runId}}`)");
            sb.AppendLine(
                $"- Decision nodes — {PilotExportLinkHonestyCopy.ReviewLinkBaseNotStored} (`GET /v1/architecture/review/{{runId}}/decisions`) — after commit");
            sb.AppendLine();
            return;
        }

        sb.AppendLine($"- [Run detail JSON]({baseUrl}/v1/architecture/review/{run.RunId}) (`GET /v1/architecture/review/{{runId}}`)");
        sb.AppendLine(
            $"- [Decision nodes]({baseUrl}/v1/architecture/review/{run.RunId}/decisions) (`GET /v1/architecture/review/{{runId}}/decisions`) — after commit");
        sb.AppendLine();
    }
}
