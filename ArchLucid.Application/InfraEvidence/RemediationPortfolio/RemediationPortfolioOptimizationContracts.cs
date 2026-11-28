using ArchLucid.Application.InfraEvidence.RemediationPrioritization;

namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

public sealed record PortfolioOptimizationPin(PortfolioBinding Binding, string GraphSha256);

public enum PortfolioEstimateKind { Unknown, Measured, ReviewedEstimate, ApprovedDefault }

public sealed record PortfolioEstimatedUnits(long? Units, PortfolioEstimateKind Kind);
public sealed record PortfolioTeamMinutes(string TeamKey, long Minutes);

/// <summary>Null staffing means unknown. A non-null vector attests complete staffing, including explicit zero use.</summary>
public sealed record PortfolioActionEstimate(string ActionId, string BasisId, PortfolioEstimatedUnits Cost,
    IReadOnlyList<PortfolioTeamMinutes>? Staff, PortfolioEstimateKind StaffKind, PortfolioEstimatedUnits Disruption);

public sealed record PortfolioScenarioWeight(string ScenarioId, long Points);

/// <summary>Cost uses currency minor units, staffing uses minutes, and disruption uses additive service-minutes.</summary>
public sealed record PortfolioResourceLimits(string Currency, long Cost, IReadOnlyList<PortfolioTeamMinutes> Staff, long Disruption);

/// <summary>Previously captured ranking from the caller's authorized context. The optimizer never refreshes or persists ranks.</summary>
public sealed record PortfolioTopNInput(PortfolioOptimizationPin Pin, string RankingVersion,
    IReadOnlyList<Guid> OrderedFindingIds, int TargetSize)
{
    public static PortfolioTopNInput FromCapturedSecureNowRanking(PortfolioOptimizationPin pin, string rankingVersion,
        IReadOnlyList<RemediationPrioritizedFinding> ranked, int targetSize)
    {
        ArgumentNullException.ThrowIfNull(ranked);
        return new(pin, rankingVersion, RemediationPortfolioGraph.Freeze(
            ranked.Take(PortfolioOptimizationInput.MaxRankedFindings + 1).Select(row => row.FindingId)), targetSize);
    }
}

public sealed record PortfolioSearchLimits(int MaxSearchNodes, int MaxBaselineEvaluations, TimeSpan Timeout);

public sealed record PortfolioOptimizationRequest(PortfolioOptimizationPin Pin, string ObjectiveVersion, string ConstraintVersion,
    PortfolioResourceLimits Limits, IReadOnlyList<PortfolioScenarioWeight> ScenarioWeights,
    IReadOnlyList<PortfolioActionEstimate> Estimates, IReadOnlyList<string> MandatoryActionIds, PortfolioTopNInput TopN,
    PortfolioSearchLimits Search);

public enum PortfolioOptimizationStatus { InvalidInput, GraphUnavailable, Infeasible, Optimal, WorkLimit, TimeLimit, Cancelled }
public enum PortfolioBaselineStatus { NotRun, Completed, WorkLimit, TimeLimit, Cancelled }

public sealed record PortfolioResourceUsage(long Cost, IReadOnlyList<PortfolioTeamMinutes> Staff, long Disruption);
public sealed record PortfolioAdvisoryPlan(IReadOnlyList<string> SelectedActionIds, IReadOnlyList<string> CoveredScenarioIds,
    IReadOnlyList<string> UnknownScenarioIds, long ModeledCoveragePoints, PortfolioResourceUsage Usage);

public sealed record PortfolioBaselineResult(PortfolioBaselineStatus Status, PortfolioAdvisoryPlan? Plan, int Evaluations);

public sealed record PortfolioOptimizationResult(string SolverVersion, PortfolioOptimizationStatus Status,
    string? InputSha256, PortfolioAdvisoryPlan? BestFeasiblePlan, long? UpperBoundPoints, long? OptimalityGapPoints,
    PortfolioBaselineResult TopN, PortfolioBaselineResult Greedy, int EvaluatedSearchNodes,
    IReadOnlyList<PortfolioIssue> Issues);

/// <summary>Read-only planning over an already authorized, pinned graph. A result is not execution approval.</summary>
public interface IRemediationPortfolioOptimizer
{
    PortfolioOptimizationResult Optimize(PortfolioOptimizationPin authorizedPin, RemediationPortfolioGraph graph,
        PortfolioOptimizationRequest request, CancellationToken cancellationToken = default);
}
