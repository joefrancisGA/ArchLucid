using ArchLucid.Contracts.Findings;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <inheritdoc cref="IFindingClaimCoverageEvaluator" />
public sealed class FindingClaimCoverageEvaluator : IFindingClaimCoverageEvaluator
{
    private readonly ILogger<FindingClaimCoverageEvaluator> _logger;

    /// <param name="logger">Logger used for bounded-label coverage trend lines (consumed by log aggregation).</param>
    public FindingClaimCoverageEvaluator(ILogger<FindingClaimCoverageEvaluator> logger)
    {
        ArgumentNullException.ThrowIfNull(logger);
        _logger = logger;
    }

    /// <inheritdoc />
    public FindingClaimCoverageReport Evaluate(IReadOnlyList<ArchitectureFinding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        if (findings.Count == 0)
            return new FindingClaimCoverageReport(0, 0, 0, 1.0, []);

        int supported = 0;
        int heuristic = 0;
        List<string> unsupportedIds = [];

        foreach (ArchitectureFinding finding in findings)
        {
            bool hasEvidenceRefs = finding.EvidenceRefs.Count > 0;

            if (hasEvidenceRefs)
            {
                supported++;
                continue;
            }

            bool isHeuristicLabeled = finding.ConfidenceLevel == FindingConfidenceLevel.Low;

            if (isHeuristicLabeled)
            {
                heuristic++;
                continue;
            }

            unsupportedIds.Add(finding.FindingId);
        }

        double coverageRatio = (double)(supported + heuristic) / findings.Count;

        _logger.LogInformation(
            "[FindingClaimCoverage] CoverageRatio={CoverageRatio:F4} Supported={Supported} Heuristic={Heuristic} Unsupported={Unsupported} Total={Total}",
            coverageRatio,
            supported,
            heuristic,
            unsupportedIds.Count,
            findings.Count);

        return new FindingClaimCoverageReport(
            TotalFindingCount: findings.Count,
            SupportedFindingCount: supported,
            HeuristicFindingCount: heuristic,
            CoverageRatio: coverageRatio,
            UnsupportedFindingIds: unsupportedIds);
    }
}
