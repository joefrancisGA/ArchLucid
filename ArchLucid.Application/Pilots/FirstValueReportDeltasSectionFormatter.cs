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
            $"| Findings (total) | {PilotRunDeltasFindingsTotalFormatter.FormatMarkdownTableCell(deltas)} | {FormatFindingsTotalSource(deltas)} |");
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
            if (PilotRunDeltasFindingsEmptySeverityHonesty.HasMaterialFindingWithoutSeverityBuckets(deltas))
            {
                sb.AppendLine(
                    CultureInfo.InvariantCulture,
                    $"_({PilotRunDeltasFindingsEmptySeverityHonesty.FindingsBySeverityNotAttestedLabel})_");
            }
            else if (PilotRunDeltasFindingsEmptySeverityHonesty.IsMutedOnlyEmptySeverity(deltas))
            {
                sb.AppendLine(
                    CultureInfo.InvariantCulture,
                    $"_({PilotRunDeltasFindingsTotalFormatter.MutedOnlyFindingsTotalLabel})_");
            }
            else if (PilotRunDeltasFindingsEmptySeverityHonesty.IsSnapshotAttestedZeroUnmuted(deltas))
            {
                sb.AppendLine(
                    CultureInfo.InvariantCulture,
                    $"_({PilotRunDeltasFindingsEmptySeverityHonesty.SnapshotZeroUnmutedFindingsPlainLabel})_");
            }
            else if (PilotRunDeltasFindingsEmptySeverityHonesty.IsAgentResultsOmittedEmptySeverity(deltas))
            {
                sb.AppendLine(
                    CultureInfo.InvariantCulture,
                    $"_({PilotSponsorMaterialFindingsHonestyCopy.AgentFindingsNotStored})_");
            }
            else if (PilotRunDeltasFindingsEmptySeverityHonesty.IsAgentResultsIncludedEmptySeverity(deltas))
            {
                sb.AppendLine(
                    CultureInfo.InvariantCulture,
                    $"_({PilotRunDeltasFindingsEmptySeverityHonesty.AgentResultsIncludedEmptySeverityPlainLabel})_");
            }
            else
            {
                sb.AppendLine(
                    CultureInfo.InvariantCulture,
                    $"_({PilotRunDeltasFindingsTotalFormatter.FindingsTotalNotAttestedLabel})_");
            }

            sb.AppendLine();
            return;
        }

        sb.AppendLine("| Severity | Count |");
        sb.AppendLine("| --- | ---: |");
        foreach (KeyValuePair<string, int> row in deltas.FindingsBySeverity)
        {
            string severity = FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(row.Key);
            sb.AppendLine(CultureInfo.InvariantCulture, $"| {severity} | {row.Value} |");
        }
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
            sb.AppendLine(
                FormattableString.Invariant($"_({PilotRunDeltasTimeToCommitFormatter.NoCommittedManifestWallClockPlain})_"));
            sb.AppendLine();
            return;
        }

        sb.AppendLine(
            $"Wall-clock from {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode("RunRecord.CreatedUtc")} to {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode("GoldenManifest.CommittedUtc")}: **{wall:c}**.");
        sb.AppendLine(
            $"Created: {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(deltas.RunCreatedUtc.ToString("O", CultureInfo.InvariantCulture))} · Committed: {FirstValueReportMarkdownFormatting.WrapMarkdownInlineCode(deltas.ManifestCommittedUtc?.ToString("O", CultureInfo.InvariantCulture) ?? "Committed time was not stored.")}.");
        sb.AppendLine();
    }

    private static string FormatTimeToCommit(PilotRunDeltas deltas) =>
        PilotRunDeltasTimeToCommitFormatter.FormatMarkdownTableCell(deltas);

    private static string FormatAuditRowCount(PilotRunDeltas deltas) =>
        PilotRunDeltasAuditRowCountFormatter.FormatMarkdownTableCell(deltas);

    private static string FormatLlmCallCount(PilotRunDeltas deltas) =>
        PilotRunDeltasLlmCallCountFormatter.FormatMarkdownTableCell(deltas);

    private static string FormatFindingsTotal(PilotRunDeltas deltas) =>
        PilotRunDeltasFindingsTotalFormatter.FormatFindingsTotal(deltas);

    private static string FormatFindingsTotalSource(PilotRunDeltas deltas)
    {
        string list = PilotRunDeltasFindingsEmptySeverityHonesty.ResolveFindingsTotalSourceList(deltas);

        if (PilotRunDeltasFindingsEmptySeverityHonesty.IsMutedOnlyEmptySeverity(deltas))
        {
            return list;
        }

        return deltas.MutedFindingsExcludedCount > 0
            ? $"{list}; muted findings excluded"
            : list;
    }
}
