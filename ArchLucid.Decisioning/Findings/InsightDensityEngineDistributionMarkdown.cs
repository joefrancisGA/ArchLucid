namespace ArchLucid.Decisioning.Findings;

/// <summary>Markdown report for per-engine insight-density distribution measurements.</summary>
public static class InsightDensityEngineDistributionMarkdown
{
    /// <summary>Substring tests assert so record-mode regeneration cannot drop the disclaimer.</summary>
    public const string ClaimBoundaryMarker = "claimBoundary:";

    /// <summary>Engines registered in <c>GoldenCorpusHarness.CreateEngines()</c> (WK-06).</summary>
    public const int GoldenCorpusHarnessEngineCount = 14;

    /// <summary>Product <c>EngineType</c> ids in <c>BuiltInFindingEngineTypeCatalog</c>.</summary>
    public const int BuiltInProductEngineCount = 39;

    public static string Build(IReadOnlyList<InsightDensityEngineDistributionRow> rows)
    {
        ArgumentNullException.ThrowIfNull(rows);

        int enginesInTable = rows
            .Select(static row => row.EngineType)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count();

        int absentFromTable = Math.Max(0, BuiltInProductEngineCount - enginesInTable);

        List<string> lines = [
            "# Insight-density engine distribution",
            "",
            $"{ClaimBoundaryMarker} Advisory-only measurement — scores do **not** demote typed-engine findings in production.",
            "DeterministicInsightDensityGate returns Promote / DecisionGradeFinding for non-agent findings",
            "(penalty reason `typed-engine-protected`); the computed score is visible here but is not a control.",
            $"The golden corpus harness registers **{GoldenCorpusHarnessEngineCount}** engines; **{enginesInTable}** appear in this table (≥1 finding across case-01..case-34). **{absentFromTable}** built-in product engines are absent from this corpus-derived slice.",
            "`WouldDemoteIfUnprotectedCount` is a counterfactual (score below DemotionThreshold) — not production demotion behavior.",
            "",
            "Advisory scores from deterministic `DeterministicInsightDensityGate` over the decisioning golden corpus.",
            "Typed-engine-protected findings are never demoted in production — a low median signals engine output quality, not a gate bug.",
            "",
            "| Engine | Findings | Min | Median | Max | Would demote if unprotected |",
            "| --- | --- | --- | --- | --- | --- |",
        ];

        foreach (InsightDensityEngineDistributionRow row in rows)
        {
            lines.Add(
                $"| {row.EngineType} | {row.FindingCount} | {row.MinScore} | {row.MedianScore} | {row.MaxScore} | {row.WouldDemoteIfUnprotectedCount} |");
        }

        lines.Add("");

        return string.Join('\n', lines) + "\n";
    }
}
