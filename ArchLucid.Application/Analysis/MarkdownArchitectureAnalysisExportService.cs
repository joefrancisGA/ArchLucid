using System.Text;

namespace ArchLucid.Application.Analysis;

public sealed partial class MarkdownArchitectureAnalysisExportService : IArchitectureAnalysisExportService
{
    public string GenerateMarkdown(ArchitectureAnalysisReport report)
    {
        ArgumentNullException.ThrowIfNull(report);

        StringBuilder sb = new();

        sb.AppendLine("# ArchLucid Analysis Report");
        sb.AppendLine();
        sb.AppendLine($"- Run ID: {report.Run.RunId}");
        sb.AppendLine(
            $"- Request ID: {ConsultingDocxExportHonestyCopy.ResolveRequestId(report.Run.RequestId)}");
        sb.AppendLine($"- Run Status: {report.Run.Status}");
        sb.AppendLine($"- Created UTC: {report.Run.CreatedUtc:O}");

        sb.AppendLine(
            report.Run.CompletedUtc.HasValue
                ? $"- Completed UTC: {report.Run.CompletedUtc.Value:O}"
                : $"- Completed UTC: {ArchitectureEvidenceRequestExport.MissingCompletedTimeCopy}");

        sb.AppendLine(
            $"- Current Manifest Version: {FormatCurrentManifestVersion(report.Run.CurrentManifestVersion)}");

        sb.AppendLine();

        if (report.Warnings.Count > 0)
        {
            sb.AppendLine("## Report Warnings");
            sb.AppendLine();
            sb.AppendLine(string.Join(
                Environment.NewLine,
                report.Warnings.Select(static warning =>
                    $"- {(string.IsNullOrWhiteSpace(warning) ? "Warning text was stored empty." : warning.Trim())}")));
            sb.AppendLine();
        }

        AppendEvidenceAndTraces(sb, report);
        AppendManifestAndDiagram(sb, report);
        AppendDeterminismAndDiffs(sb, report);

        return sb.ToString();
    }

    private static string FormatCurrentManifestVersion(string? manifestVersion) =>
        string.IsNullOrWhiteSpace(manifestVersion)
            ? ArchitectureEvidenceRequestExport.CurrentManifestVersionNotStoredCopy
            : manifestVersion.Trim();

    private static string FormatDeterminismRunId(string? runId, string notStoredCopy) =>
        string.IsNullOrWhiteSpace(runId) ? notStoredCopy : runId.Trim();
}
