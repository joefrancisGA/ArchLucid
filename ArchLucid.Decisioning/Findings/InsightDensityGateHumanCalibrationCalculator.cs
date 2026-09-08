using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Joins gate median scores to human DidNotThinkOfThat novelty rates (DX-67).</summary>
public static class InsightDensityGateHumanCalibrationCalculator
{
    public const int NoveltySampleFloor = 5;

    public static IReadOnlyList<InsightDensityGateHumanCalibrationRow> Calculate(
        FindingsSnapshot snapshot,
        IInsightDensityGate gate,
        InsightDensityGateOptions options,
        IReadOnlyList<EngineInsightNoveltyRateRow>? noveltyRates)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(gate);
        ArgumentNullException.ThrowIfNull(options);

        InsightDensityEngineDistribution distribution = InsightDensityEngineDistributionCalculator.Calculate(
            snapshot,
            gate,
            options);

        Dictionary<string, EngineInsightNoveltyRateRow> noveltyByEngine = (noveltyRates ?? [])
            .GroupBy(static row => row.EngineType, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(static group => group.Key, static group => group.First(), StringComparer.OrdinalIgnoreCase);

        Dictionary<string, int> decisionGradeCounts = snapshot.Findings
            .Where(static finding => finding.Classification == FindingClassification.DecisionGradeFinding)
            .GroupBy(static finding => finding.EngineType, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(static group => group.Key, static group => group.Count(), StringComparer.OrdinalIgnoreCase);

        List<InsightDensityGateHumanCalibrationRow> rows = distribution.Rows
            .Select(row =>
            {
                decisionGradeCounts.TryGetValue(row.EngineType, out int decisionGradeCount);
                noveltyByEngine.TryGetValue(row.EngineType, out EngineInsightNoveltyRateRow? noveltyRow);

                double? noveltyRate = decisionGradeCount >= NoveltySampleFloor && noveltyRow?.Rate is not null
                    ? noveltyRow.Rate
                    : null;

                return new InsightDensityGateHumanCalibrationRow
                {
                    EngineType = row.EngineType,
                    FindingCount = row.FindingCount,
                    DecisionGradeCount = decisionGradeCount,
                    MedianScore = row.MedianScore,
                    DidNotThinkOfThatCount = noveltyRow?.DidNotThinkOfThatCount ?? 0,
                    NoveltyRate = noveltyRate,
                };
            })
            .OrderBy(static row => row.EngineType, StringComparer.OrdinalIgnoreCase)
            .ToList();

        ApplyResiduals(rows);

        return rows;
    }

    /// <summary>Builds engine-type residual map for Premium judge-cap selection (DX-67).</summary>
    public static IReadOnlyDictionary<string, double>? TryBuildJudgeResidualMap(
        IReadOnlyList<Finding> candidates,
        IReadOnlyList<EngineInsightNoveltyRateRow>? noveltyRates)
    {
        ArgumentNullException.ThrowIfNull(candidates);

        if (candidates.Count == 0)
        {
            return null;
        }

        Dictionary<string, EngineInsightNoveltyRateRow> noveltyByEngine = (noveltyRates ?? [])
            .GroupBy(static row => row.EngineType, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(static group => group.Key, static group => group.First(), StringComparer.OrdinalIgnoreCase);

        List<InsightDensityGateHumanCalibrationRow> rows = candidates
            .Where(static finding => !string.IsNullOrWhiteSpace(finding.EngineType))
            .GroupBy(static finding => finding.EngineType.Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(group =>
            {
                List<int> scores = group
                    .Select(static finding => finding.InsightDensityScore ?? 0)
                    .OrderBy(static score => score)
                    .ToList();

                int medianScore = scores[scores.Count / 2];
                noveltyByEngine.TryGetValue(group.Key, out EngineInsightNoveltyRateRow? noveltyRow);

                double? noveltyRate = group.Count() >= NoveltySampleFloor && noveltyRow?.Rate is not null
                    ? noveltyRow.Rate
                    : null;

                return new InsightDensityGateHumanCalibrationRow
                {
                    EngineType = group.Key,
                    FindingCount = group.Count(),
                    DecisionGradeCount = group.Count(),
                    MedianScore = medianScore,
                    DidNotThinkOfThatCount = noveltyRow?.DidNotThinkOfThatCount ?? 0,
                    NoveltyRate = noveltyRate,
                };
            })
            .OrderBy(static row => row.EngineType, StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (rows.Count == 0)
        {
            return null;
        }

        ApplyResiduals(rows);

        Dictionary<string, double> residuals = new(StringComparer.OrdinalIgnoreCase);

        foreach (InsightDensityGateHumanCalibrationRow row in rows)
        {
            if (row.Residual is not double residual)
            {
                continue;
            }

            residuals[row.EngineType] = residual;
        }

        return residuals.Count == 0 ? null : residuals;
    }

    internal static void ApplyResiduals(IList<InsightDensityGateHumanCalibrationRow> rows)
    {
        List<InsightDensityGateHumanCalibrationRow> scoredRows = rows
            .Where(static row => row.FindingCount > 0)
            .ToList();
        List<InsightDensityGateHumanCalibrationRow> noveltyRows = rows
            .Where(static row => row.NoveltyRate is not null)
            .ToList();

        Dictionary<string, double> scoreRanks = BuildPercentileRanks(
            scoredRows,
            static row => row.MedianScore);
        Dictionary<string, double> noveltyRanks = BuildPercentileRanks(
            noveltyRows,
            static row => row.NoveltyRate!.Value);

        foreach (InsightDensityGateHumanCalibrationRow row in rows)
        {
            if (row.NoveltyRate is null || row.FindingCount == 0)
            {
                row.Residual = null;

                continue;
            }

            if (!noveltyRanks.TryGetValue(row.EngineType, out double noveltyRank)
                || !scoreRanks.TryGetValue(row.EngineType, out double scoreRank))
            {
                row.Residual = null;

                continue;
            }

            row.Residual = noveltyRank - scoreRank;
        }
    }

    private static Dictionary<string, double> BuildPercentileRanks(
        IReadOnlyList<InsightDensityGateHumanCalibrationRow> rows,
        Func<InsightDensityGateHumanCalibrationRow, double> valueSelector)
    {
        if (rows.Count == 0)
        {
            return new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
        }

        List<(string EngineType, double Value)> ordered = rows
            .Select(row => (row.EngineType, valueSelector(row)))
            .OrderBy(static pair => pair.Item2)
            .ToList();

        Dictionary<string, double> ranks = new(StringComparer.OrdinalIgnoreCase);

        for (int index = 0; index < ordered.Count; index++)
        {
            double percentile = ordered.Count == 1 ? 1 : (double)index / (ordered.Count - 1);
            ranks[ordered[index].EngineType] = percentile;
        }

        return ranks;
    }
}
