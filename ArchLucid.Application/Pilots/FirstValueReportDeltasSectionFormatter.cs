using System.Globalization;
using System.Text;

using ArchLucid.Application.Runs;

namespace ArchLucid.Application.Pilots;

/// <summary>Computed deltas, findings-by-severity, and elapsed-time sections for the first-value report.</summary>
public static class FirstValueReportDeltasSectionFormatter
{
    /// <summary>Sponsor-facing banner appended above any computed line for runs that match the demo seed.</summary>
    public const string DemoTenantBanner = "_demo tenant — replace before publishing._";

    public static void AppendComputedDeltasSection(StringBuilder sb, PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(deltas);

        sb.AppendLine("## Computed deltas (from this run)");
        sb.AppendLine();
        if (deltas.IsDemoTenant)
        {
            sb.AppendLine(DemoTenantBanner);
            sb.AppendLine();
        }

        sb.AppendLine("| Metric | Value | Source |");
        sb.AppendLine("| --- | --- | --- |");
        sb.AppendLine($"| Time to committed manifest | {FormatTimeToCommit(deltas)} | `RunRecord.CreatedUtc` → `GoldenManifest.CommittedUtc` |");
        sb.AppendLine(
            $"| Findings (total) | {FormatFindingsTotal(deltas)} | {FormatFindingsTotalSource(deltas)} |");
        sb.AppendLine($"| LLM calls for this run | {FormatLlmCallCount(deltas)} | `archlucid_llm_calls_per_run` (per-run trace count) |");
        sb.AppendLine($"| Audit rows for this run | {FormatAuditRowCount(deltas)} | `IAuditRepository.CountFilteredAsync(RunId)` |");
        sb.AppendLine();
    }

    public static void AppendFindingsSection(StringBuilder sb, PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(deltas);

        sb.AppendLine("## Findings by severity");
        sb.AppendLine();
        if (deltas.FindingsBySeverity.Count == 0)
        {
            if (deltas.MutedFindingsExcludedCount > 0)
            {
                sb.AppendLine(
                    "_(Unmuted finding count was zero; muted findings were excluded from severity counts.)_");
            }
            else
            {
                sb.AppendLine("_(No unmuted findings were stored for this run.)_");
            }

            sb.AppendLine();
            return;
        }

        sb.AppendLine("| Severity | Count |");
        sb.AppendLine("| --- | ---: |");
        foreach (KeyValuePair<string, int> row in deltas.FindingsBySeverity)
            sb.AppendLine($"| {row.Key} | {row.Value} |");
        sb.AppendLine();
    }

    public static void AppendFindingsTrustHonestySection(StringBuilder sb)
    {
        ArgumentNullException.ThrowIfNull(sb);

        sb.AppendLine("## Finding trust honesty");
        sb.AppendLine();
        sb.AppendLine(
            "Severity counts may include heuristic or ungrounded findings. Open the architecture package in ArchLucid for per-finding trust labels before sponsor circulation — heuristic findings are labeled or excluded on Working exports.");
        sb.AppendLine();
    }

    public static void AppendElapsedSection(StringBuilder sb, PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(deltas);

        sb.AppendLine("## Time to committed output");
        sb.AppendLine();
        if (deltas.TimeToCommittedManifest is not { } wall)
        {
            sb.AppendLine("_(Run has no committed manifest — elapsed time not computed.)_");
            sb.AppendLine();
            return;
        }

        sb.AppendLine($"Wall-clock from `RunRecord.CreatedUtc` to `GoldenManifest.CommittedUtc`: **{wall:c}**.");
        sb.AppendLine($"Created: `{deltas.RunCreatedUtc:O}` · Committed: `{deltas.ManifestCommittedUtc:O}`.");
        sb.AppendLine();
    }

    private static string FormatTimeToCommit(PilotRunDeltas deltas)
    {
        return deltas.TimeToCommittedManifest is not { } wall
            ? "Time to committed manifest was not stored."
            : $"**{wall:c}** (committed `{deltas.ManifestCommittedUtc:O}`)";
    }

    private static string FormatAuditRowCount(PilotRunDeltas deltas)
    {
        if (!deltas.AuditRowCountResolved)
            return "Audit row count was not attested.";

        if (deltas.AuditRowCount == 0)
            return "0";
        return deltas.AuditRowCountTruncated
            ? $"{deltas.AuditRowCount}+ _(query cap reached — exact count is at least this many)_"
            : deltas.AuditRowCount.ToString(CultureInfo.InvariantCulture);
    }

    private static string FormatLlmCallCount(PilotRunDeltas deltas)
    {
        if (!deltas.LlmCallCountResolved)
            return "_(not attested — execution trace query failed)_";

        return deltas.LlmCallCount.ToString(CultureInfo.InvariantCulture);
    }

    private static string FormatFindingsTotal(PilotRunDeltas deltas) =>
        PilotRunDeltasFindingsTotalFormatter.FormatFindingsTotal(deltas);

    private static string FormatFindingsTotalSource(PilotRunDeltas deltas)
    {
        string list = deltas.FindingsCountsFromSnapshot
            ? "`FindingsSnapshot.Findings` (unmuted only)"
            : "`ArchitectureRunDetail.Results[*].Findings` (unmuted only)";

        return deltas.MutedFindingsExcludedCount > 0
            ? $"{list}; muted findings excluded"
            : list;
    }
}
