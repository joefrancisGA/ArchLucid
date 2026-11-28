namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

/// <summary>Advisory output for an already authorized graph. No plan or what-if scenario grants execution approval.</summary>
public static class PortfolioExplanation
{
    public const string SchemaVersion = "FND092-portfolio-explanation-v1";

    // The caller is responsible for approving these hypothetical inputs in the pinned context.
    // A basis ID records that decision; it is not an authorization token.
    public sealed record ApprovedSensitivityCase(string Id, string ApprovalBasisId, long? CostLimit,
        string? ObjectiveVersion, IReadOnlyList<PortfolioScenarioWeight> WeightOverrides);

    public sealed record Request(PortfolioPareto.Request Planning, IReadOnlyList<string> CriticalScenarioIds,
        IReadOnlyList<ApprovedSensitivityCase> ApprovedSensitivityCases);

    public enum Status { Built, InvalidInput, Cancelled }
    public enum ScenarioState { ModeledCovered, ModeledUncovered, Unknown }
    public enum AddBlocker { EvidenceUnavailable, EstimateUnavailable, Conflict, Cost, Staffing, Disruption }
    public enum AddFinding { Blocked, NoAdditionalModeledPoints, FeasibleAddNotSelected }

    public sealed record Scenario(string Id, string CauseId, bool Critical, ScenarioState State, long? Weight,
        long ContributedPoints, IReadOnlyList<PortfolioEvidenceReference> Evidence);

    public sealed record FindingLink(Guid FindingId, int? CapturedRank);

    public sealed record SelectedAction(string Id, string Kind, bool ExplicitlyMandatory, bool RequiredByMandatoryClosure,
        IReadOnlyList<string> PrerequisiteActionIds, IReadOnlyList<string> ModeledCauseIds, IReadOnlyList<FindingLink> Findings,
        IReadOnlyList<PortfolioEvidenceReference> Evidence, PortfolioActionEstimate Estimate,
        IReadOnlyList<string> RemovedWithAction, long ModeledPointsLostOnRemoval);

    // Blockers are measured relative to adding this action and its prerequisites to this portfolio.
    // They do not claim that all substitutions or other portfolios are infeasible.
    public sealed record ExcludedAction(string Id, string Kind, PortfolioActionEstimate? Estimate,
        IReadOnlyList<string> PrerequisiteActionIds, IReadOnlyList<string> UnavailableActionIds, IReadOnlyList<FindingLink> Findings,
        IReadOnlyList<PortfolioRelationshipEdge> Conflicts, IReadOnlyList<PortfolioPareto.BindingConstraint> ExceededLimits,
        IReadOnlyList<AddBlocker> Blockers, AddFinding Finding, long? AdditionalModeledPoints,
        IReadOnlyList<PortfolioIssue> EvidenceIssues);

    public sealed record Plan(PortfolioPareto.Alternative Alternative, IReadOnlyList<Scenario> Scenarios,
        IReadOnlyList<SelectedAction> Selected, IReadOnlyList<ExcludedAction> Excluded);

    public sealed record Frontier(string SolverVersion, PortfolioPareto.Status Status, string? InputSha256,
        int SearchNodes, int RetainedAlternatives, bool OutputTruncated, IReadOnlyList<PortfolioIssue> Issues);

    public sealed record Change(IReadOnlyList<string> AddedActionIds, IReadOnlyList<string> RemovedActionIds,
        IReadOnlyList<string> NewlyCoveredScenarioIds, IReadOnlyList<string> NoLongerCoveredScenarioIds,
        long PointsOnOriginalScale, long DeltaPointsOnOriginalScale, long DeltaCost, long DeltaDisruption,
        IReadOnlyList<PortfolioTeamMinutes> DeltaStaff);

    public sealed record Sensitivity(ApprovedSensitivityCase Assumptions, PortfolioResourceLimits Limits,
        string ObjectiveVersion, Frontier Frontier, PortfolioPareto.Alternative? FirstFeasibleAlternative, Change? Difference);

    public sealed record Result(string Version, Status Status, PortfolioOptimizationPin? Pin, string? GraphVersion,
        string? ObjectiveVersion, string? ConstraintVersion, string? RankingVersion, string? InputSha256,
        PortfolioResourceLimits? Limits, PortfolioSearchLimits? SearchLimits, Frontier? Frontier, IReadOnlyList<Plan> Plans,
        IReadOnlyList<Sensitivity> Sensitivities, IReadOnlyList<string> NotRunSensitivityIds, string? Detail);
}
