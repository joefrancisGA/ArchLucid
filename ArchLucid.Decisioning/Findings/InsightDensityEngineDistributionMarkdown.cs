using ArchLucid.Decisioning.Plugins;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Markdown report for per-engine insight-density distribution measurements.</summary>
public static class InsightDensityEngineDistributionMarkdown
{
    /// <summary>Substring tests assert so record-mode regeneration cannot drop the disclaimer.</summary>
    public const string ClaimBoundaryMarker = "claimBoundary:";

    /// <summary>Engines registered in the golden corpus harness (graph + effectful).</summary>
    public static int GoldenCorpusHarnessEngineCount => GoldenCorpusHarnessEngineRegistration.RegisteredEngineCount;

    /// <summary>Product <c>EngineType</c> ids in <c>BuiltInFindingEngineTypeCatalog</c>.</summary>
    public static int BuiltInProductEngineCount => BuiltInFindingEngineTypeCatalog.EngineTypeIds.Count;

    public static string Build(IReadOnlyList<InsightDensityEngineDistributionRow> rows)
    {
        ArgumentNullException.ThrowIfNull(rows);

        int enginesInTable = rows
            .Select(static row => row.EngineType)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count();

        int absentFromTable = Math.Max(0, BuiltInProductEngineCount - enginesInTable);
        string caseRangeEnd = GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber
            .ToString(System.Globalization.CultureInfo.InvariantCulture);

        List<string> lines = [
            "# Insight-density engine distribution",
            "",
            $"{ClaimBoundaryMarker} Production gate (ADR 0070) — scores demote typed-engine findings when the predicate fails.",
            "DeterministicInsightDensityGate applies the demotion predicate to agent and typed-engine findings",
            "(penalty reason `typed-engine-scored` for engine origin); checklist rows remain on the package snapshot.",
            $"The golden corpus harness registers **{GoldenCorpusHarnessEngineCount}** engines; **{enginesInTable}** appear in this table (≥1 finding across case-01..case-{caseRangeEnd}). **{absentFromTable}** built-in product engines are absent from this corpus-derived slice.",
            "`WouldDemoteIfUnprotectedCount` matches production demotion when the predicate applies (ADR 0070).",
            "",
            "Advisory scores from deterministic `DeterministicInsightDensityGate` over the decisioning golden corpus.",
            "Low medians on typed engines signal output quality — demotion to checklist is expected when anchors and evidence are absent.",
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
