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
        sb.AppendLine($"- Request ID: {report.Run.RequestId}");
        sb.AppendLine($"- Run Status: {report.Run.Status}");
        sb.AppendLine($"- Created UTC: {report.Run.CreatedUtc:O}");

        if (report.Run.CompletedUtc.HasValue)

            sb.AppendLine($"- Completed UTC: {report.Run.CompletedUtc.Value:O}");

        if (!string.IsNullOrWhiteSpace(report.Run.CurrentManifestVersion))

            sb.AppendLine($"- Current Manifest Version: {report.Run.CurrentManifestVersion}");

        sb.AppendLine();

        if (report.Warnings.Count > 0)
        {
            sb.AppendLine("## Report Warnings");
            sb.AppendLine();
            sb.AppendLine(string.Join(Environment.NewLine, report.Warnings.Select(static warning => $"- {warning}")));
            sb.AppendLine();
        }

        AppendEvidenceAndTraces(sb, report);
        AppendManifestAndDiagram(sb, report);
        AppendDeterminismAndDiffs(sb, report);

        return sb.ToString();
    }
}
