using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Measures how many decision-grade findings are not covered by a frontier baseline transcript.
/// </summary>
public static class InsightDensityFrontierDeltaCalculator
{
    /// <summary>
    ///     Title-level topical overlap threshold. Deliberately looser than the 0.70/0.85 duplication thresholds
    ///     because cross-model phrasing differs more than intra-snapshot phrasing.
    /// </summary>
    public const double DefaultMatchSimilarityThreshold = 0.60;

    public static FrontierDeltaSignal Calculate(
        FindingsSnapshot snapshot,
        IReadOnlyList<FrontierBaselineFinding> baseline,
        double matchSimilarityThreshold)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(baseline);

        List<Finding> decisionGradeFindings = snapshot.Findings
            .Where(IsDecisionGradeFinding)
            .ToList();

        if (decisionGradeFindings.Count == 0)
        {
            return new FrontierDeltaSignal
            {
                TotalFindingCount = 0,
                CoveredByBaselineCount = 0,
                NovelFindingCount = 0,
                NoveltyPercentage = 0.0,
                ByEngine = [],
            };
        }

        List<(string EngineType, bool IsNovel)> perFinding = [];

        int coveredByBaselineCount = 0;

        foreach (Finding finding in decisionGradeFindings)
        {
            bool isCovered = IsCoveredByBaseline(finding, baseline, matchSimilarityThreshold);

            if (isCovered)
            {
                coveredByBaselineCount++;
            }

            perFinding.Add((finding.EngineType, !isCovered));
        }

        int novelFindingCount = decisionGradeFindings.Count - coveredByBaselineCount;
        double noveltyPercentage = (novelFindingCount / (double)decisionGradeFindings.Count) * 100.0;

        List<FrontierDeltaEngineRow> byEngine = perFinding
            .GroupBy(x => x.EngineType, StringComparer.OrdinalIgnoreCase)
            .OrderBy(g => g.Key, StringComparer.OrdinalIgnoreCase)
            .Select(g =>
            {
                List<(string EngineType, bool IsNovel)> engineFindings = g.ToList();
                int findingCount = engineFindings.Count;
                int engineNovelCount = engineFindings.Count(x => x.IsNovel);
                double engineNoveltyPercentage = findingCount == 0
                    ? 0.0
                    : (engineNovelCount / (double)findingCount) * 100.0;

                return new FrontierDeltaEngineRow
                {
                    EngineType = g.Key,
                    FindingCount = findingCount,
                    NovelFindingCount = engineNovelCount,
                    NoveltyPercentage = engineNoveltyPercentage,
                };
            })
            .ToList();

        return new FrontierDeltaSignal
        {
            TotalFindingCount = decisionGradeFindings.Count,
            CoveredByBaselineCount = coveredByBaselineCount,
            NovelFindingCount = novelFindingCount,
            NoveltyPercentage = noveltyPercentage,
            ByEngine = byEngine,
        };
    }

    private static bool IsDecisionGradeFinding(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        return finding.Classification is null
            || finding.Classification == FindingClassification.DecisionGradeFinding;
    }

    private static bool IsCoveredByBaseline(
        Finding finding,
        IReadOnlyList<FrontierBaselineFinding> baseline,
        double matchSimilarityThreshold)
    {
        foreach (FrontierBaselineFinding baselineFinding in baseline)
        {
            if (RuleIdsMatch(finding.PolicyRuleId, baselineFinding.RuleId))
            {
                return true;
            }

            if (!CategoriesMatch(finding.Category, baselineFinding.Category))
            {
                continue;
            }

            double titleSimilarity = InsightDensityTextSimilarity.JaccardSimilarity(
                finding.Title,
                baselineFinding.Title);

            if (titleSimilarity >= matchSimilarityThreshold)
            {
                return true;
            }
        }

        return false;
    }

    private static bool RuleIdsMatch(string? findingRuleId, string? baselineRuleId)
    {
        if (string.IsNullOrWhiteSpace(findingRuleId) || string.IsNullOrWhiteSpace(baselineRuleId))
        {
            return false;
        }

        return string.Equals(
            findingRuleId.Trim(),
            baselineRuleId.Trim(),
            StringComparison.OrdinalIgnoreCase);
    }

    private static bool CategoriesMatch(string findingCategory, string baselineCategory)
    {
        return string.Equals(
            findingCategory.Trim(),
            baselineCategory.Trim(),
            StringComparison.OrdinalIgnoreCase);
    }
}
