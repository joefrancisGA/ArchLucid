using static ArchLucid.Application.InfraEvidence.RemediationPortfolio.PortfolioOptimizationModel;

namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

/// <summary>Deterministic bounded maximum weighted coverage. No repository, provider, or execution dependencies.</summary>
public sealed class BoundedRemediationPortfolioOptimizer(TimeProvider timeProvider) : IRemediationPortfolioOptimizer
{
    public const string Version = "FND089-bounded-coverage-v1";
    private readonly TimeProvider clock = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public PortfolioOptimizationResult Optimize(PortfolioOptimizationPin authorizedPin, RemediationPortfolioGraph graph,
        PortfolioOptimizationRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(authorizedPin);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(request);

        long started = clock.GetTimestamp();
        if (authorizedPin != new PortfolioOptimizationPin(graph.Binding, graph.GraphSha256)
            || request.Pin != authorizedPin || request.TopN?.Pin != authorizedPin)
            return Failed(PortfolioOptimizationStatus.InvalidInput, "pin", "scope_or_current_input_pin_mismatch");
        if (cancellationToken.IsCancellationRequested)
            return Failed(PortfolioOptimizationStatus.Cancelled, "search", "cancelled");
        if (!graph.CanEvaluateSelections)
            return Failed(PortfolioOptimizationStatus.GraphUnavailable, "graph", "dependency_or_snapshot_coverage_incomplete");

        var input = PortfolioOptimizationInput.Snapshot(graph, request);
        if (input is null)
            return Failed(PortfolioOptimizationStatus.InvalidInput, "input", "invalid_or_incomplete_planning_input");

        var run = new RunClock(clock, started, input.Search.Timeout, cancellationToken);
        var initialStop = Stop(run, 0, input.Search.MaxSearchNodes);
        if (initialStop is { } stopping)
            return Failed(stopping, "search", "stopped_before_candidate_validation");

        string digest = PortfolioOptimizationInput.Digest(input, Version);
        var model = new PortfolioOptimizationModel(graph, input);
        if (Stop(run, 0, input.Search.MaxSearchNodes) is { } afterSnapshot)
            return Failed(afterSnapshot, "search", "stopped_before_candidate_validation", digest);
        if (!Contains(model.EvidenceAvailable, model.Mandatory))
            return Failed(PortfolioOptimizationStatus.GraphUnavailable, "mandatory", "mandatory_evidence_unavailable", digest, model.Issues);
        if (!Contains(model.Available, model.Mandatory))
            return Failed(PortfolioOptimizationStatus.InvalidInput, "mandatory", "mandatory_resource_estimate_missing", digest, model.Issues);
        if (!model.IsFeasible(model.Mandatory))
            return Failed(PortfolioOptimizationStatus.Infeasible, "mandatory", "mandatory_closure_exceeds_limit_or_conflicts", digest, model.Issues);

        var required = new Candidate(model.Mandatory, model.Score(model.Mandatory));
        var top = TopN(model, required, run, input.Search.MaxBaselineEvaluations);
        var greedy = Greedy(model, required, run, input.Search.MaxBaselineEvaluations);
        Candidate best = Better(top.Best, greedy.Best) ? top.Best : greedy.Best;
        if (Better(required, best))
            best = required;

        var exact = Search(model, best, run, input.Search.MaxSearchNodes);
        long upper = exact.Status == PortfolioOptimizationStatus.Optimal
            ? exact.Best.Score : model.Score(model.Searchable);
        return new(Version, exact.Status, digest, model.Describe(exact.Best.Mask), upper, upper - exact.Best.Score,
            DescribeBaseline(model, top), DescribeBaseline(model, greedy), exact.Work, model.Issues);
    }

    private static SearchOutcome TopN(PortfolioOptimizationModel model, Candidate initial, RunClock clock, int limit)
    {
        var selection = initial;
        int evaluations = 0;
        if (Stop(clock, evaluations, limit) is { } before)
            return new(before, selection, evaluations);
        foreach (UInt128 bit in model.RankedActions)
        {
            if (Contains(selection.Mask, bit))
                continue;
            if (Stop(clock, evaluations, limit) is { } stop)
                return new(stop, selection, evaluations);
            evaluations++;
            UInt128 proposed = selection.Mask | model.Closure(bit);
            if (model.IsFeasible(proposed))
                selection = new(proposed, model.Score(proposed));
        }

        return new(Stop(clock, 0, limit) ?? PortfolioOptimizationStatus.Optimal, selection, evaluations);
    }

    private static SearchOutcome Greedy(PortfolioOptimizationModel model, Candidate initial, RunClock clock, int limit)
    {
        var selection = initial;
        int evaluations = 0;
        while (true)
        {
            if (Stop(clock, 0, limit) is { } before)
                return new(before, selection, evaluations);
            var next = selection;
            foreach (UInt128 bundle in model.BeneficialBundles)
            {
                UInt128 proposed = selection.Mask | bundle;
                if (proposed == selection.Mask)
                    continue;
                if (Stop(clock, evaluations, limit) is { } stop)
                    return new(stop, next, evaluations);
                evaluations++;
                if (!model.IsFeasible(proposed))
                    continue;
                var candidate = new Candidate(proposed, model.Score(proposed));
                if (candidate.Score > selection.Score && Better(candidate, next))
                    next = candidate;
            }

            if (next == selection)
                return new(Stop(clock, 0, limit) ?? PortfolioOptimizationStatus.Optimal, selection, evaluations);
            selection = next;
        }
    }

    private static SearchOutcome Search(PortfolioOptimizationModel model, Candidate incumbent, RunClock clock, int limit)
    {
        int visited = 0;
        Stack<(UInt128 Selected, UInt128 Rejected)> frontier = new();
        frontier.Push((model.Mandatory, 0));
        while (frontier.TryPop(out var state))
        {
            if (Stop(clock, visited, limit) is { } stop)
                return new(stop, incumbent, visited);
            visited++;
            UInt128 possible = model.Searchable & ~state.Rejected;
            // Ignoring costs and conflicts here can only overstate achievable weighted coverage.
            if (model.Score(possible) < incumbent.Score)
                continue;

            var candidate = new Candidate(state.Selected, model.Score(state.Selected));
            if (Better(candidate, incumbent))
                incumbent = candidate;

            UInt128 remaining = possible & ~state.Selected;
            if (remaining == 0)
                continue;

            UInt128 next = Bit(Index(remaining));
            frontier.Push((state.Selected, state.Rejected | next));
            UInt128 include = state.Selected | model.Closure(next);
            if ((include & state.Rejected) == 0 && model.IsFeasible(include))
                frontier.Push((include, state.Rejected));
        }

        return new(Stop(clock, 0, limit) ?? PortfolioOptimizationStatus.Optimal, incumbent, visited);
    }

    private static bool Better(Candidate first, Candidate second)
    {
        if (first.Score != second.Score)
            return first.Score > second.Score;
        UInt128 a = UInt128.PopCount(first.Mask);
        UInt128 b = UInt128.PopCount(second.Mask);
        if (a != b)
            return a < b;
        UInt128 difference = first.Mask ^ second.Mask;
        return difference != 0 && Contains(first.Mask, Bit(Index(difference)));
    }

    private static PortfolioOptimizationStatus? Stop(RunClock run, int work, int max)
    {
        if (run.Token.IsCancellationRequested)
            return PortfolioOptimizationStatus.Cancelled;
        if (run.Clock.GetElapsedTime(run.Started) >= run.Timeout)
            return PortfolioOptimizationStatus.TimeLimit;
        return work >= max ? PortfolioOptimizationStatus.WorkLimit : null;
    }

    private static PortfolioBaselineResult DescribeBaseline(PortfolioOptimizationModel model, SearchOutcome outcome) =>
        new(outcome.Status switch
        {
            PortfolioOptimizationStatus.Optimal => PortfolioBaselineStatus.Completed,
            PortfolioOptimizationStatus.Cancelled => PortfolioBaselineStatus.Cancelled,
            PortfolioOptimizationStatus.TimeLimit => PortfolioBaselineStatus.TimeLimit,
            _ => PortfolioBaselineStatus.WorkLimit,
        }, model.Describe(outcome.Best.Mask), outcome.Work);

    private static PortfolioOptimizationResult Failed(PortfolioOptimizationStatus status, string subject, string reason,
        string? digest = null, IReadOnlyList<PortfolioIssue>? issues = null)
    {
        var notRun = new PortfolioBaselineResult(PortfolioBaselineStatus.NotRun, null, 0);
        return new(Version, status, digest, null, null, null, notRun, notRun, 0,
            RemediationPortfolioGraph.SortIssues((issues ?? []).Append(new(subject, reason))));
    }

    private sealed record RunClock(TimeProvider Clock, long Started, TimeSpan Timeout, CancellationToken Token);
    private readonly record struct Candidate(UInt128 Mask, long Score);
    private readonly record struct SearchOutcome(PortfolioOptimizationStatus Status, Candidate Best, int Work);
}
