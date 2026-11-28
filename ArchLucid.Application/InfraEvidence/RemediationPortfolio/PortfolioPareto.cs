namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

/// <summary>Solver-neutral advisory alternatives over the existing authorized planning request.</summary>
public static class PortfolioPareto
{
    public sealed record Request(PortfolioOptimizationRequest Planning, int MaxAlternatives);

    public enum Status
    {
        InvalidInput,
        GraphUnavailable,
        Infeasible,
        Complete,
        WorkLimit,
        TimeLimit,
        Cancelled,
        FrontierLimit,
    }

    public enum ConstraintKind { Cost, Disruption, Staffing }

    public sealed record BindingConstraint(ConstraintKind Kind, string? TeamKey, long Limit);

    public sealed record Alternative(PortfolioAdvisoryPlan Plan, IReadOnlyList<BindingConstraint> BindingConstraints);

    /// <summary>
    /// Complete means all distinct nondominated objective vectors in the selectable pinned model were established.
    /// OutputTruncated means not all retained alternatives fit the response, even if the search was complete.
    /// Partial alternatives are nondominated only within the evaluated search, not globally.
    /// </summary>
    public sealed record Result(string SolverVersion, Status Outcome, string? InputSha256,
        IReadOnlyList<Alternative> Alternatives, int RetainedAlternatives, bool OutputTruncated,
        int EvaluatedSearchNodes, IReadOnlyList<PortfolioIssue> Issues);

    public interface IOptimizer
    {
        Result OptimizeAlternatives(PortfolioOptimizationPin authorizedPin, RemediationPortfolioGraph graph,
            Request request, CancellationToken cancellationToken = default);
    }
}
