using System.Collections.Generic;
using System.Linq;

using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Reports;

public sealed record SponsorReportFinding(
    string FindingId,
    string RunId,
    string Category,
    decimal CostSavingsUsd,
    int RiskReductionScore);

public sealed record SponsorReportResult(
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

public static class SponsorReportAggregator
{
    public static SponsorReportResult Aggregate(IEnumerable<SponsorReportFinding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        List<SponsorReportFinding> rawFindings = findings.ToList();
        
        List<SponsorReportFinding> uniqueFindings = rawFindings
            .GroupBy(f => f.FindingId)
            .Select(g => new SponsorReportFinding(
                g.Key,
                g.First().RunId,
                g.First().Category,
                g.Max(f => f.CostSavingsUsd),
                g.Max(f => f.RiskReductionScore)
            ))
            .ToList();

        return new SponsorReportResult(
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
