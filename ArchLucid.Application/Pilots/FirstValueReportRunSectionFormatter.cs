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
        sb.AppendLine($"| Support run id | {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(run.RunId)} |");
        sb.AppendLine($"| Status | {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(run.Status.ToString())} |");
        sb.AppendLine(
            $"| Request id | {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(string.IsNullOrWhiteSpace(run.RequestId) ? "Request id was not stored." : run.RequestId.Trim())} |");
        sb.AppendLine($"| Created (UTC) | {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(run.CreatedUtc.ToString("O", CultureInfo.InvariantCulture))} |");
        sb.AppendLine(
            $"| Completed (UTC) | {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(run.CompletedUtc is null ? "Completed time was not stored." : run.CompletedUtc.Value.ToString("O", CultureInfo.InvariantCulture))} |");
        if (manifest is null)
        {
            sb.AppendLine("| Committed manifest | Committed manifest was not stored. |");
            sb.AppendLine();
            return;
        }

        sb.AppendLine(
            $"| System | {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(string.IsNullOrWhiteSpace(manifest.SystemName) ? "System name was not stored." : manifest.SystemName.Trim())} |");
        sb.AppendLine(
            $"| Manifest version | {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(string.IsNullOrWhiteSpace(manifest.Metadata.ManifestVersion) ? "Manifest version was not stored." : manifest.Metadata.ManifestVersion.Trim())} |");
        sb.AppendLine($"| Commit snapshot (UTC) | {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(manifest.Metadata.CreatedUtc.ToString("O", CultureInfo.InvariantCulture))} |");
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
