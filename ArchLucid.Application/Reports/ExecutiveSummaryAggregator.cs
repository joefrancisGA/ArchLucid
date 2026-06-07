using System.Collections.Generic;
using System.Linq;

using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Reports;

public sealed record ExecutiveSummaryFinding(
    string FindingId,
    string RunId,
    string Category,
    decimal CostSavingsUsd,
    int RiskReductionScore);

public sealed record ExecutiveSummaryResult(
    decimal TotalCostSavingsUsd,
    int TotalRiskReductionScore,
    int UniqueFindingCount,
    int RawFindingCount,
    decimal? CostWasteUsd,
    int SecurityRiskCount,
    int ReliabilityGapCount,
    int PendingGovernanceDecisionCount = 0,
    string HeadlineSavingsScopeCode = RoiSponsorFacingScopeCodes.HeadlineDispositionAware,
    string HeadlineSavingsScopeDescription = RoiSponsorFacingScopeDescriptions.HeadlineDispositionAware,
    string Trailing30DayActivityScopeDescription = RoiSponsorFacingScopeDescriptions.Trailing30DayFindingEvents);

public static class ExecutiveSummaryAggregator
{
    public static ExecutiveSummaryResult Aggregate(IEnumerable<ExecutiveSummaryFinding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        List<ExecutiveSummaryFinding> rawFindings = findings.ToList();
        
        List<ExecutiveSummaryFinding> uniqueFindings = rawFindings
            .GroupBy(f => f.FindingId)
            .Select(g => new ExecutiveSummaryFinding(
                g.Key,
                g.First().RunId,
                g.First().Category,
                g.Max(f => f.CostSavingsUsd),
                g.Max(f => f.RiskReductionScore)
            ))
            .ToList();

        return new ExecutiveSummaryResult(
            TotalCostSavingsUsd: uniqueFindings.Sum(f => f.CostSavingsUsd),
            TotalRiskReductionScore: uniqueFindings.Sum(f => f.RiskReductionScore),
            UniqueFindingCount: uniqueFindings.Count,
            RawFindingCount: rawFindings.Count,
            CostWasteUsd: uniqueFindings.Where(f => f.Category == "Cost").Sum(f => f.CostSavingsUsd),
            SecurityRiskCount: uniqueFindings.Count(f => f.Category == "Security"),
            ReliabilityGapCount: uniqueFindings.Count(f => f.Category == "Reliability")
        );
    }
}
