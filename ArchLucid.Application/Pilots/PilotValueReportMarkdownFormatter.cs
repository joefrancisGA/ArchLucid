using System.Globalization;
using System.Text;

using ArchLucid.Application.Exports;
using ArchLucid.Application.Reporting;

namespace ArchLucid.Application.Pilots;

/// <inheritdoc cref="IPilotValueReportMarkdownFormatter" />
public sealed class PilotValueReportMarkdownFormatter(ExportFormatterService exportFormatter) : IPilotValueReportMarkdownFormatter
{
    private readonly ExportFormatterService _exportFormatter =
        exportFormatter ?? throw new ArgumentNullException(nameof(exportFormatter));

    /// <inheritdoc />
    public string Format(PilotValueReport r)
    {
        ArgumentNullException.ThrowIfNull(r);

        StringBuilder sb = new();

        sb.AppendLine("# ArchLucid pilot value report");
        sb.AppendLine();
        sb.AppendLine($"**Sponsor ROI honesty:** {SendableExportCoverComposer.SponsorRoiNonSummingHeadlineLine}");
        sb.AppendLine($"**Policy influence:** {SendableExportCoverComposer.PolicyPackInfluenceHonestyLine}");
        sb.AppendLine();
        _exportFormatter.AppendMarkdownTwoColumnTableStart(sb, "Field", "Value");
        sb.AppendLine(CultureInfo.InvariantCulture, $"| Tenant | `{r.TenantId}` |");
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"| Window (UTC) | `{_exportFormatter.FormatIso8601Utc(r.FromUtc)}` inclusive → `{_exportFormatter.FormatIso8601Utc(r.ToUtc)}` exclusive |");
        if (RunDetailSampleLoadedNoRows(r))
        {
            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Committed runs | {r.TotalRunsCommitted} (0 loaded for detail in partial sample) |");
        }
        else if (r.CommittedRunsInventoryTruncated)
        {
            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Committed runs | {r.TotalRunsCommitted} (partial inventory: count may under-count in-window committed runs) |");
        }
        else
        {
            sb.AppendLine(CultureInfo.InvariantCulture, $"| Committed runs | {r.TotalRunsCommitted} |");
        }

        if (RunDetailSampleLoadedNoRows(r) && !r.RunDetailsTruncated)
        {
            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Run-detail cap | {r.RunDetailCap} (truncated: false; 0 committed runs loaded for detail in the partial sample) |");
        }
        else if (r.RunDetailsTruncated)
        {
            if (r.CommittedRunsTimeline.Count == 0 && r.TotalRunsCommitted > 0)
            {
                sb.AppendLine(
                    CultureInfo.InvariantCulture,
                    $"| Run-detail cap | {r.RunDetailCap} (truncated: true; 0 of newest committed runs loaded for detail) |");
            }
            else
            {
                sb.AppendLine(
                    CultureInfo.InvariantCulture,
                    $"| Run-detail cap | {r.RunDetailCap} (truncated: true; newest committed runs by CreatedUtc) |");
            }
        }
        else
        {
            sb.AppendLine(CultureInfo.InvariantCulture,
                $"| Run-detail cap | {r.RunDetailCap} (truncated: {r.RunDetailsTruncated}) |");
        }
        sb.AppendLine(CultureInfo.InvariantCulture, $"| Audit export truncated | {r.AuditExportTruncated} |");
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"| Committed-run inventory truncated | {r.CommittedRunsInventoryTruncated} |");
        sb.AppendLine(
            CultureInfo.InvariantCulture,
            $"| ROI source freshness disposition | {EscapeCell(r.RoiSourceFreshnessDisposition)} |");
        sb.AppendLine();

        sb.AppendLine("## Summary");
        sb.AppendLine();
        _exportFormatter.AppendMarkdownTwoColumnTableStart(sb, "Metric", "Value");

        if (RunDetailSampleLoadedNoRows(r))
        {
            sb.AppendLine("| Total findings | not computed — no committed runs loaded for detail in the partial sample |");
        }
        else if (r.RunDetailsTruncated)
        {
            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| Total findings | {r.TotalFindings} {PartialRunDetailSampleFragment(r.RunDetailCap)} |");
        }
        else
        {
            sb.AppendLine(CultureInfo.InvariantCulture, $"| Total findings | {r.TotalFindings} |");
        }

        string avgCompletionCell = RunDetailSampleLoadedNoRows(r)
            ? "not computed — no committed runs loaded for detail in the partial sample"
            : FormatAvgSeconds(r.AveragePipelineCompletionSeconds);

        if (r.RunDetailsTruncated && !RunDetailSampleLoadedNoRows(r))
            avgCompletionCell = $"{avgCompletionCell} {PartialRunDetailSampleFragment(r.RunDetailCap)}";

        sb.AppendLine(CultureInfo.InvariantCulture, $"| Avg pipeline completion | {avgCompletionCell} |");

        sb.AppendLine(CultureInfo.InvariantCulture,
            $"| Recommendations generated (audit) | {r.TotalRecommendationsProduced} |");
        sb.AppendLine(CultureInfo.InvariantCulture, $"| Governance approvals | {r.GovernanceApprovals} |");
        sb.AppendLine(CultureInfo.InvariantCulture, $"| Governance rejections | {r.GovernanceRejections} |");
        sb.AppendLine(CultureInfo.InvariantCulture, $"| Policy pack assignments | {r.PolicyPackAssignments} |");
        sb.AppendLine(CultureInfo.InvariantCulture,
            $"| Comparison / drift detections | {r.ComparisonOrDriftDetections} |");
        sb.AppendLine(CultureInfo.InvariantCulture, $"| Pending approvals (now) | {r.GovernancePendingApprovalsNow} |");
        sb.AppendLine();

        sb.AppendLine("## Findings by severity");
        sb.AppendLine();

        if (RunDetailSampleLoadedNoRows(r))
        {
            sb.AppendLine(
                "> Severity counts were not computed — no committed runs loaded for detail in the partial sample.");
            sb.AppendLine();
        }
        else if (r.RunDetailsTruncated)
        {
            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"> Severity counts reflect a partial run-detail sample: newest {r.RunDetailCap} committed runs by CreatedUtc.");
            sb.AppendLine();
        }

        if (!RunDetailSampleLoadedNoRows(r))
        {
            _exportFormatter.AppendMarkdownTwoColumnTableStart(sb, "Severity", "Count");
            sb.AppendLine(CultureInfo.InvariantCulture, $"| Critical | {r.FindingsBySeverity.Critical} |");
            sb.AppendLine(CultureInfo.InvariantCulture, $"| High | {r.FindingsBySeverity.High} |");
            sb.AppendLine(CultureInfo.InvariantCulture, $"| Medium | {r.FindingsBySeverity.Medium} |");
            sb.AppendLine(CultureInfo.InvariantCulture, $"| Low | {r.FindingsBySeverity.Low} |");
            sb.AppendLine(CultureInfo.InvariantCulture, $"| Info | {r.FindingsBySeverity.Info} |");
            sb.AppendLine();
            AppendSeverityNote(sb);
            sb.AppendLine();
        }

        sb.AppendLine("## Agent types observed");
        sb.AppendLine();

        if (r.RunDetailsTruncated && r.UniqueAgentTypes.Count > 0)
        {
            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"> Agent types listed reflect the same partial run-detail sample: newest {r.RunDetailCap} committed runs by CreatedUtc.");
            sb.AppendLine();
        }

        if (r.UniqueAgentTypes.Count == 0)
        {
            if (RunDetailSampleLoadedNoRows(r))
            {
                sb.AppendLine(
                    "Agent types were not computed — no committed runs loaded for detail in the partial sample.");
            }
            else if (r.RunDetailsTruncated)
            {
                sb.AppendLine(
                    CultureInfo.InvariantCulture,
                    $"No agent types appeared in the loaded run-detail sample (newest {r.RunDetailCap} committed runs by CreatedUtc); additional types may exist on runs excluded by the cap.");
            }
            else
            {
                sb.AppendLine("Agent types were not stored.");
            }
        }
        else
        {
            sb.AppendLine(string.Join(", ", r.UniqueAgentTypes.Select(static t => $"`{t}`")));
        }
        sb.AppendLine();

        if (RunDetailSampleLoadedNoRows(r))
        {
            string committedRunsHeading = r.RunDetailsTruncated
                ? FormattableString.Invariant(
                    $"## Committed runs (sample: 0 of {r.TotalRunsCommitted} in-window committed runs loaded for detail)")
                : FormattableString.Invariant(
                    $"## Committed runs (0 of {r.TotalRunsCommitted} in-window committed runs loaded for detail)");

            sb.AppendLine(committedRunsHeading);
        }
        else if (r.RunDetailsTruncated)
        {
            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"## Committed runs (sample: {r.CommittedRunsTimeline.Count} of {r.TotalRunsCommitted} in-window committed runs loaded for detail)");
        }
        else
        {
            sb.AppendLine("## Committed runs (sample loaded for detail)");
        }

        sb.AppendLine();
        _exportFormatter.AppendMarkdownFourColumnTableStart(sb, "Run", "Created (UTC)", "Committed (UTC)", "System");

        foreach (PilotValueReportRunTimelinePoint row in r.CommittedRunsTimeline)
        {
            string committedCell = row.CommittedUtc is null
                ? "Committed time was not stored."
                : _exportFormatter.FormatIso8601UtcMarkdownQuotedCell(row.CommittedUtc);

            sb.AppendLine(
                CultureInfo.InvariantCulture,
                $"| `{row.RunId}` | {_exportFormatter.FormatIso8601UtcMarkdownQuotedCell(row.CreatedUtc)} | {committedCell} | {EscapeCell(row.SystemName)} |");
        }

        sb.AppendLine();
        sb.AppendLine("— *Generated by ArchLucid in-product pilot value report.*");

        return sb.ToString();
    }

    private static bool RunDetailSampleLoadedNoRows(PilotValueReport report) =>
        report.CommittedRunsTimeline.Count == 0 && report.TotalRunsCommitted > 0;

    private static string PartialRunDetailSampleFragment(int runDetailCap) =>
        FormattableString.Invariant($"(partial run-detail sample: newest {runDetailCap} committed runs by CreatedUtc)");

    private static void AppendSeverityNote(StringBuilder sb)
    {
        sb.AppendLine(
            "> Severity mapping: pipeline `FindingSeverity` uses Critical / High (Error) / Medium (Warning) / Info; `Low` is reserved for future contract extensions.");
    }

    private static string FormatAvgSeconds(double? seconds)
    {
        if (seconds is null)
            return "Average pipeline completion was not stored.";

        double s = seconds.Value;

        if (double.IsNaN(s) || double.IsInfinity(s))
            return "Average pipeline completion was not stored.";

        if (s >= 3600)
            return $"{s / 3600:0.##} h";

        return s >= 60 ? $"{s / 60:0.##} min" : $"{s:0.##} s";
    }

    private static string EscapeCell(string value)
    {
        return string.IsNullOrEmpty(value)
            ? "System name was not stored."
            : value.Replace("|", "\\|", StringComparison.Ordinal);
    }
}
