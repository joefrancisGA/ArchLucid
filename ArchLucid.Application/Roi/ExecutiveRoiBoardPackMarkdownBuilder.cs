using System.Globalization;
using System.Text;

using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Roi;

/// <summary>Formats a one-page executive ROI board pack as Markdown (no LLM calls).</summary>
public static class ExecutiveRoiBoardPackMarkdownBuilder
{
    /// <summary>Builds the board-pack Markdown body from a summary response.</summary>
    public static string Build(
        string tenantDisplayName,
        DateTime generatedUtc,
        ExecutiveRoiSummaryResponse summary,
        string? traceId)
    {
        ArgumentNullException.ThrowIfNull(summary);

        string tenant = string.IsNullOrWhiteSpace(tenantDisplayName) ? "Tenant" : tenantDisplayName.Trim();
        StringBuilder sb = new();

        sb.AppendLine("# Executive ROI — Board Pack");
        sb.AppendLine();
        sb.AppendLine($"**Tenant:** {tenant}");
        sb.AppendLine($"**Generated (UTC):** {generatedUtc:yyyy-MM-dd HH:mm:ss} Z");
        sb.AppendLine($"**Systems in scope:** {summary.SystemCount.ToString(CultureInfo.InvariantCulture)}");
        sb.AppendLine();
        sb.AppendLine($"## Estimated savings: {FormatUsd(summary.TotalEstimatedUsdSavings)}");
        sb.AppendLine();
        sb.AppendLine("## Top systemic issues");
        sb.AppendLine();

        if (summary.TopSystemicIssues.Count == 0)
        {
            sb.AppendLine("_No recurring finding themes in the latest committed runs._");
        }
        else
        {
            sb.AppendLine("| Category | Severity | Count |");
            sb.AppendLine("| --- | --- | ---: |");

            foreach (SystemicIssueSummary issue in summary.TopSystemicIssues.Take(5))
            {
                sb.AppendLine(
                    $"| {EscapeCell(issue.Category)} | {EscapeCell(issue.Severity)} | {issue.Count.ToString(CultureInfo.InvariantCulture)} |");
            }
        }

        sb.AppendLine();
        sb.AppendLine("## Latest run per system");
        sb.AppendLine();
        sb.AppendLine("| System | Latest run | Committed (UTC) | Est. savings (USD) |");
        sb.AppendLine("| --- | --- | --- | ---: |");

        foreach (SystemLatestRunRoi system in summary.Systems.OrderByDescending(static s => s.CommittedUtc))
        {
            string committed = system.CommittedUtc.HasValue
                ? system.CommittedUtc.Value.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture)
                : "—";

            string savings = system.EstimatedUsdSavings.HasValue
                ? FormatUsd(system.EstimatedUsdSavings.Value)
                : "—";

            sb.AppendLine(
                $"| {EscapeCell(system.SystemName)} | `{EscapeCell(system.RunId)}` | {committed} | {savings} |");
        }

        sb.AppendLine();

        if (!string.IsNullOrWhiteSpace(traceId))
        {
            sb.AppendLine("---");
            sb.AppendLine();
            sb.AppendLine($"_Support trace ID: `{traceId.Trim()}`_");
        }

        return sb.ToString();
    }

    internal static string FormatUsd(decimal amount) =>
        amount.ToString("C0", CultureInfo.GetCultureInfo("en-US"));

    private static string EscapeCell(string value)
    {
        if (string.IsNullOrEmpty(value))
            return string.Empty;

        return value.Replace("|", "/", StringComparison.Ordinal).Replace("\n", " ", StringComparison.Ordinal);
    }
}
