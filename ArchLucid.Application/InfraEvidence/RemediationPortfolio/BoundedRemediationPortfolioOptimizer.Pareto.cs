using ArchLucid.Application.Analysis;

using static ArchLucid.Application.InfraEvidence.RemediationPortfolio.PortfolioOptimizationModel;

namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

public sealed partial class BoundedRemediationPortfolioOptimizer
{
    public const string ParetoVersion = "FND091-bounded-pareto-v1";
    public const int MaxReturnedAlternatives = 32;
    internal const int MaxTrackedAlternatives = 256;

    public PortfolioPareto.Result OptimizeAlternatives(PortfolioOptimizationPin authorizedPin, RemediationPortfolioGraph graph,
        PortfolioPareto.Request request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(authorizedPin);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(request);

        if (request.Planning is not { } planning || request.MaxAlternatives is < 1 or > MaxReturnedAlternatives)
            return new(ParetoVersion, PortfolioPareto.Status.InvalidInput, null, [], 0, false, 0,
                [new("input", "invalid_pareto_return_limit_or_request")]);

        var (prepared, failure) = Prepare(authorizedPin, graph, planning, cancellationToken, request.MaxAlternatives);

        if (prepared is null)
            return new(ParetoVersion, MapStatus(failure!.Status), failure.InputSha256, [], 0, false, 0, failure.Issues);

        var model = prepared.Model;
        var run = prepared.Run;
        var limits = prepared.Input.Limits;
        int visited = 0;
        List<FrontierEntry> frontier = [];
        Stack<(UInt128 Selected, UInt128 Rejected)> work = new();
        work.Push((model.Mandatory, 0));
        PortfolioPareto.Status outcome = PortfolioPareto.Status.Complete;

        while (work.TryPop(out var state))
        {
            if (Stop(run, visited, prepared.Input.Search.MaxSearchNodes) is { } stop)
            {
                outcome = MapStatus(stop);
                break;
            }

            visited++;
            var resources = model.ObjectiveResources(state.Selected);
            UInt128 possible = model.Searchable & ~state.Rejected;
            var optimistic = new Objective(model.Score(possible), resources.Cost, resources.Disruption);

            // The coverage upper bound ignores feasibility. Nonnegative costs and disruption make
            // the selected prefix a lower bound on those two objectives for every descendant.

            if (frontier.Any(entry => Dominates(entry.Objective, optimistic)))
                continue;

            UInt128 remaining = possible & ~state.Selected;
            var objective = remaining == 0 ? optimistic : optimistic with { Points = model.Score(state.Selected) };

            if (!Offer(frontier, state.Selected, objective, model))
            {
                outcome = PortfolioPareto.Status.FrontierLimit;
                break;
            }

            if (remaining == 0)
                continue;

            UInt128 next = Bit(Index(remaining));
            work.Push((state.Selected, state.Rejected | next));
            UInt128 include = state.Selected | model.Closure(next);

            if ((include & state.Rejected) == 0 && model.IsFeasible(include))
                work.Push((include, state.Rejected));
        }

        if (outcome == PortfolioPareto.Status.Complete && Stop(run, 0, prepared.Input.Search.MaxSearchNodes) is { } lastStop)
            outcome = MapStatus(lastStop);

        var alternatives = frontier.OrderByDescending(entry => entry.Objective.Points)
            .ThenBy(entry => entry.Objective.Cost).ThenBy(entry => entry.Objective.Disruption)
            .Take(request.MaxAlternatives)
            .Select(entry => new PortfolioPareto.Alternative(entry.Plan, BindingConstraints(entry.Plan, limits)));
        return new(ParetoVersion, outcome, prepared.Digest, RemediationPortfolioGraph.Freeze(alternatives),
            frontier.Count, frontier.Count > request.MaxAlternatives, visited, model.Issues);
    }

    private static bool Offer(List<FrontierEntry> frontier, UInt128 mask, Objective objective, PortfolioOptimizationModel model)
    {
        foreach (var entry in frontier)
        {
            if (Dominates(entry.Objective, objective)
                || (entry.Objective == objective && !Better(new(mask, objective.Points), new(entry.Mask, objective.Points))))
                return true;
        }

        _ = frontier.RemoveAll(entry => entry.Objective == objective || Dominates(objective, entry.Objective));

        if (frontier.Count >= MaxTrackedAlternatives)
            return false;

        // Describe rechecks selection feasibility and independently asks the pinned graph to score coverage.
        // Fully validate before retaining a candidate so an interrupted run can still return safe alternatives.
        var plan = model.Describe(mask);

        if (plan.Usage.Cost != objective.Cost || plan.Usage.Disruption != objective.Disruption)
            throw new InvalidOperationException("The portfolio objectives disagreed with validated resource usage.");

        frontier.Add(new(mask, objective, plan));
        return true;
    }

    private static bool Dominates(Objective a, Objective b) =>
        a.Points >= b.Points && a.Cost <= b.Cost && a.Disruption <= b.Disruption && a != b;

    private static IReadOnlyList<PortfolioPareto.BindingConstraint> BindingConstraints(PortfolioAdvisoryPlan plan,
        PortfolioResourceLimits limits)
    {
        List<PortfolioPareto.BindingConstraint> result = [];

        if (plan.Usage.Cost == limits.Cost)
            result.Add(new(PortfolioPareto.ConstraintKind.Cost, null, limits.Cost));

        if (plan.Usage.Disruption == limits.Disruption)
            result.Add(new(PortfolioPareto.ConstraintKind.Disruption, null, limits.Disruption));

        foreach (var (used, maximum) in plan.Usage.Staff.Zip(limits.Staff))
        {
            if (used.Minutes == maximum.Minutes)
                result.Add(new(PortfolioPareto.ConstraintKind.Staffing, maximum.TeamKey, maximum.Minutes));
        }

        return RemediationPortfolioGraph.Freeze(result);
    }

    private static string ParetoDigest(PortfolioOptimizationRequest input, int maxAlternatives) =>
        AnalysisDependencyFingerprint.Digest(new { SolverVersion = ParetoVersion, Request = input, MaxAlternatives = maxAlternatives });

    private static PortfolioPareto.Status MapStatus(PortfolioOptimizationStatus status) => status switch
    {
        PortfolioOptimizationStatus.InvalidInput => PortfolioPareto.Status.InvalidInput,
        PortfolioOptimizationStatus.GraphUnavailable => PortfolioPareto.Status.GraphUnavailable,
        PortfolioOptimizationStatus.Infeasible => PortfolioPareto.Status.Infeasible,
        PortfolioOptimizationStatus.TimeLimit => PortfolioPareto.Status.TimeLimit,
        PortfolioOptimizationStatus.WorkLimit => PortfolioPareto.Status.WorkLimit,
        PortfolioOptimizationStatus.Cancelled => PortfolioPareto.Status.Cancelled,
        _ => throw new ArgumentOutOfRangeException(nameof(status), status, "Unexpected Pareto stop reason."),
    };

    private readonly record struct Objective(long Points, long Cost, long Disruption);
    private sealed record FrontierEntry(UInt128 Mask, Objective Objective, PortfolioAdvisoryPlan Plan);
}
