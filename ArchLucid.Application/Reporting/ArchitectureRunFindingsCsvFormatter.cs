using System.Globalization;
using System.Text;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Reporting;

/// <summary>
/// Flattens <see cref="ArchitectureRunDetail" /> findings across agent results into RFC 4180-style CSV (<c>\n</c> line endings).
/// </summary>
public static class ArchitectureRunFindingsCsvFormatter
{
    internal const string HeaderLine =
        "FindingId,ResultId,TaskId,SourceAgent,Severity,Category,Message,Status,MuteReason,ConfidenceScore";

    /// <returns>CSV text including header; empty findings yield header only.</returns>
    public static string BuildCsvContent(ArchitectureRunDetail detail)
    {
        ArgumentNullException.ThrowIfNull(detail);

        StringBuilder sb = new();
        sb.Append(HeaderLine).Append('\n');

        if (detail.Results is null)
            return sb.ToString();

        foreach (AgentResult result in detail.Results)
        {
            AppendFindingsFromResult(sb, result);
        }

        return sb.ToString();
    }

    /// <summary>Count of findings under <paramref name="detail" /> (<c>null</c>-safe).</summary>
    public static int CountFindingsInDetail(ArchitectureRunDetail detail)
    {
        ArgumentNullException.ThrowIfNull(detail);

        if (detail.Results is null || detail.Results.Count == 0)
            return 0;

        int n = 0;

        foreach (AgentResult result in detail.Results)
        {
            if (result?.Findings is null || result.Findings.Count == 0)
                continue;

            foreach (ArchitectureFinding finding in result.Findings)
            {
                if (finding is not null)
                    n++;
            }
        }

        return n;
    }

    internal static string FormatFindingStatus(bool isMuted)
    {
        return isMuted ? "muted" : "active";
    }

    private static void AppendFindingsFromResult(StringBuilder sb, AgentResult? result)
    {
        if (result is null || result.Findings is null || result.Findings.Count == 0)
            return;

        foreach (ArchitectureFinding finding in result.Findings)
        {
            if (finding is null)
                continue;

            AppendFindingRow(sb, result, finding);
        }
    }

    private static void AppendFindingRow(StringBuilder sb, AgentResult result, ArchitectureFinding finding)
    {
        string confidence =
            finding.ConfidenceScore.HasValue
                ? finding.ConfidenceScore.Value.ToString(CultureInfo.InvariantCulture)
                : string.Empty;

        sb.AppendJoin(
                ',',
                ExportFormatterService.EscapeCsvField(finding.FindingId),
                ExportFormatterService.EscapeCsvField(result.ResultId),
                ExportFormatterService.EscapeCsvField(result.TaskId),
                ExportFormatterService.EscapeCsvField(result.AgentType.ToString()),
                ExportFormatterService.EscapeCsvField(finding.Severity.ToString()),
                ExportFormatterService.EscapeCsvField(finding.Category),
                ExportFormatterService.EscapeCsvField(finding.Message),
                ExportFormatterService.EscapeCsvField(FormatFindingStatus(finding.IsMuted)),
                ExportFormatterService.EscapeCsvField(finding.MuteReason),
                ExportFormatterService.EscapeCsvField(confidence))
            .Append('\n');
    }
}
