using System.Collections.Generic;
using System.Linq;

namespace ArchLucid.Application.Reports;

public sealed record ExecutiveSummaryFinding(
    string FindingId,
    string RunId,
    decimal CostSavingsUsd,
    int RiskReductionScore);

public sealed record ExecutiveSummaryResult(
    decimal TotalCostSavingsUsd,
    int TotalRiskReductionScore,
    int UniqueFindingCount,
    int RawFindingCount);

public static class ExecutiveSummaryAggregator
{
    public static ExecutiveSummaryResult Aggregate(IEnumerable<ExecutiveSummaryFinding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        List<ExecutiveSummaryFinding> rawFindings = findings.ToList();
        
        List<ExecutiveSummaryFinding> uniqueFindings = rawFindings
            .GroupBy(f => f.FindingId)
            .Select(g => g.First())
            .ToList();

        return new ExecutiveSummaryResult(
            TotalCostSavingsUsd: uniqueFindings.Sum(f => f.CostSavingsUsd),
            TotalRiskReductionScore: uniqueFindings.Sum(f => f.RiskReductionScore),
            UniqueFindingCount: uniqueFindings.Count,
            RawFindingCount: rawFindings.Count
        );
    }
}
