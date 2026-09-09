namespace ArchLucid.Decisioning.Findings;

/// <summary>Markdown artifact for declaration-security pack toggle compare on a fixed graph.</summary>
public static class PolicyPackToggleCompareMarkdown
{
    /// <summary>Substring tests assert so record-mode regeneration cannot drop the disclaimer.</summary>
    public const string ClaimBoundaryMarker = "claimBoundary:";

    public const string ArtifactRelativePath = "docs/quality/policy-pack-toggle-compare.md";

    public const string RecordEnvironmentVariable = "ARCHLUCID_RECORD_POLICY_PACK_TOGGLE_COMPARE";

    public static string Build(PolicyPackToggleCompareSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        List<string> lines =
        [
            "# Policy pack toggle compare",
            "",
            "> **Scope:** Checked-in regression artifact for declaration-security pack toggle; internal QA only — not buyer-facing certification evidence.",
            "",
            $"{ClaimBoundaryMarker} proves tenant rule keys and bundled P1 SOC 2 vs CIS Azure packs change **declaration-security-baseline** findings on a fixed graph. Coverage, topology, cost, and inventory engines remain pack-inert; not evidence that all engines are policy-aware.",
            "",
            "**Graph:** one `TopologyResource` (`api`) with `tf.public_network_access=enabled` and `httpsOnly=false`.",
            "",
            $"**Guard:** `PolicyPackToggleCompareReportTests` (`ArchLucid.Decisioning.Tests`, `Suite=Core`). Regenerate with `{RecordEnvironmentVariable}=1`.",
            "",
            "## Filtered rule-key postures (`PolicyFilteredDeclarationGoldenCorpusTests`)",
            "",
            "| Posture | Filtered rule id | Finding title | PolicyRuleId |",
            "| --- | --- | --- | --- |",
        ];

        AppendRows(lines, snapshot.FilteredRuleKeyRows, includePriorityFloor: false);

        lines.Add("");
        lines.Add("## Bundled P1 packs (`PolicyPackP1ToggleGoldenCorpusTests`)");
        lines.Add("");
        lines.Add("| Posture | Pack content file | Priority floor | Finding title | PolicyRuleId |");
        lines.Add("| --- | --- | --- | --- | --- |");

        AppendRows(lines, snapshot.BundledP1Rows, includePriorityFloor: true);
        lines.Add("");

        return string.Join('\n', lines) + "\n";
    }

    private static void AppendRows(
        List<string> lines,
        IReadOnlyList<PolicyPackToggleCompareFindingRow> rows,
        bool includePriorityFloor)
    {
        foreach (PolicyPackToggleCompareFindingRow row in rows)
        {
            if (includePriorityFloor)
            {
                lines.Add(
                    $"| {EscapeCell(row.Posture)} | {EscapeCell(row.PackOrRuleKey)} | {EscapeCell(row.PriorityFloor ?? string.Empty)} | {EscapeCell(row.FindingTitle)} | {EscapeCell(row.PolicyRuleId)} |");
            }
            else
            {
                lines.Add(
                    $"| {EscapeCell(row.Posture)} | {EscapeCell(row.PackOrRuleKey)} | {EscapeCell(row.FindingTitle)} | {EscapeCell(row.PolicyRuleId)} |");
            }
        }
    }

    private static string EscapeCell(string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        return value.Replace("|", "\\|", StringComparison.Ordinal);
    }
}
