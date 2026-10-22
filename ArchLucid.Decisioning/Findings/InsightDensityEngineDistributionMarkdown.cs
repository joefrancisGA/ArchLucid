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
            "`WouldDemoteIfUnprotectedCount` matches production demotion at default `DemotionThreshold` 65 (ADR 0070, DX-59).",
            "`WouldDemoteAt65Count` applies the same predicate at threshold 65; with production default 65 it should match `WouldDemoteIfUnprotectedCount`.",
            "",
            "Advisory scores from deterministic `DeterministicInsightDensityGate` over the decisioning golden corpus.",
            "Low medians on typed engines signal output quality — demotion to checklist is expected when anchors and evidence are absent.",
            "Recorded scores on this corpus do not form a 60/65/75/80/85 ladder; inventory and line-anchored doc bonuses apply only where those anchors exist.",
            "",
            "| Engine | Findings | Min | Median | Max | Would demote if unprotected | Generic advice | No evidence | No anchor | Duplication | Would demote at 65 |",
            "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
        ];

        foreach (InsightDensityEngineDistributionRow row in rows)
        {
            lines.Add(
                $"| {row.EngineType} | {row.FindingCount} | {row.MinScore} | {row.MedianScore} | {row.MaxScore} | {row.WouldDemoteIfUnprotectedCount} | {row.GenericAdviceCount} | {row.NoConcreteEvidenceCount} | {row.NoArchitectureAnchorCount} | {row.DuplicationCount} | {row.WouldDemoteAt65Count} |");
        }

        lines.Add("");

        return string.Join('\n', lines) + "\n";
    }
}
