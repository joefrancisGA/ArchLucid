using System.Diagnostics;

using ArchLucid.Application.InfraEvidence.RemediationPortfolio;
using ArchLucid.Core.Scoping;

using Xunit.Abstractions;

using static ArchLucid.Application.Tests.InfraEvidence.RemediationPortfolioOptimizationTests;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RemediationPortfolioParetoTests(ITestOutputHelper output)
{
    [Fact]
    public void Frontier_retains_a_tradeoff_no_linear_cost_weight_can_choose()
    {
        // The middle point cannot outrank both neighbors under benefit - weight * cost.
        // Beating A requires weight <= 1; beating C requires weight >= 3.
        var fixture = new Fixture([new("A", 2), new("B", 3), new("C", 4)],
            [new("low", 4, [["A"]]), new("middle", 5, [["B"]]), new("high", 8, [["C"]])], budget: 4);

        var result = Run(fixture);

        Assert.Equal(PortfolioPareto.Status.Complete, result.Outcome);
        Assert.False(result.OutputTruncated);
        Assert.Equal([(8L, 4L, 0L), (5L, 3L, 0L), (4L, 2L, 0L), (0L, 0L, 0L)],
            result.Alternatives.Select(x => Vector(x.Plan)).ToArray());
        Assert.Equal(["B"], result.Alternatives[1].Plan.SelectedActionIds);
    }

    [Fact]
    public void Hard_limits_and_mandatory_closure_hold_for_every_tradeoff()
    {
        var fixture = new Fixture(
            [new("Must", 1), new("Prep", 1), new("Cheap", 2, StaffA: 1, Disruption: 4),
             new("Quiet", 4, StaffB: 2, Disruption: 1), new("Blocked", 0, StaffA: 2)],
            [new("shared", 5, [["Cheap"], ["Quiet"]]), new("joint", 7, [["Prep", "Quiet"]]),
             new("unavailable", 100, [["Blocked"]])],
            [new("Must", "Prep", PortfolioRelationship.Requires),
             new("Cheap", "Quiet", PortfolioRelationship.Conflicts)],
            budget: 6, staffA: 1, staffB: 2, disruption: 4, mandatory: ["Must"]);

        var result = Run(fixture);

        AssertEqualToOracle(fixture, result);
        Assert.All(result.Alternatives, x =>
        {
            Assert.Contains("Must", x.Plan.SelectedActionIds);
            Assert.Contains("Prep", x.Plan.SelectedActionIds);
            Assert.DoesNotContain("Blocked", x.Plan.SelectedActionIds);
        });
        var quiet = result.Alternatives[0];
        Assert.Equal(12, quiet.Plan.ModeledCoveragePoints);
        Assert.Equal([new(PortfolioPareto.ConstraintKind.Cost, null, 6),
                      new(PortfolioPareto.ConstraintKind.Staffing, "review", 2)],
            quiet.BindingConstraints);
        Assert.Contains(new PortfolioPareto.BindingConstraint(PortfolioPareto.ConstraintKind.Disruption, null, 4),
            result.Alternatives.Single(x => x.Plan.SelectedActionIds.Contains("Cheap")).BindingConstraints);
        Assert.Equal(PortfolioPareto.Status.Infeasible, Run(fixture,
            fixture.Request with { Limits = fixture.Request.Limits with { Cost = 1 } }).Outcome);
    }

    [Fact]
    public void Unknown_estimates_and_coverage_are_not_treated_as_free_or_confirmed()
    {
        var fixture = new Fixture([new("A", Cost: null), new("B", Cost: 0)],
            [new("unpriced", 10, [["A"]]), new("proven", 3, [["B"]]), new("unknown", 200, [["B"]], false)]);
        var result = Run(fixture);

        Assert.Equal(PortfolioPareto.Status.Complete, result.Outcome);
        var plan = Assert.Single(result.Alternatives).Plan;
        Assert.Equal(["B"], plan.SelectedActionIds);
        Assert.Equal(["unknown"], plan.UnknownScenarioIds);
        Assert.Equal(3, plan.ModeledCoveragePoints);
        Assert.Contains(new PortfolioIssue("A", "resource_estimate_missing"), result.Issues);
        var required = Run(fixture, fixture.Request with { MandatoryActionIds = ["A"] });
        Assert.Equal(PortfolioPareto.Status.InvalidInput, required.Outcome);
        Assert.Empty(required.Alternatives);
    }

    [Fact]
    public void Failed_scope_stale_pins_incomplete_graph_and_invalid_cap_produce_no_alternatives()
    {
        var fixture = IndependentActions(4);
        var otherScope = ProjectSnapshotScopeKey.Create(
            ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()), Guid.NewGuid());
        var wrong = fixture.Pin with { Binding = fixture.Pin.Binding with { Scope = otherScope } };
        var stale = fixture.Pin with { GraphSha256 = new string('0', 64) };
        var incomplete = new Fixture([new("A")], [], complete: false);

        foreach (var invalid in new[]
        {
            Run(fixture, authorized: wrong),
            Run(fixture, fixture.Request with { Pin = stale }),
            Run(fixture, fixture.Request with { TopN = fixture.Request.TopN with { Pin = stale } }),
            Run(fixture, fixture.Request with { Estimates = [] }, maxAlternatives: 0),
            Run(fixture, maxAlternatives: BoundedRemediationPortfolioOptimizer.MaxReturnedAlternatives + 1),
        })
        {
            Assert.Equal(PortfolioPareto.Status.InvalidInput, invalid.Outcome);
            Assert.Empty(invalid.Alternatives);
            Assert.Null(invalid.InputSha256);
        }

        var unavailable = Run(incomplete);
        Assert.Equal(PortfolioPareto.Status.GraphUnavailable, unavailable.Outcome);
        Assert.Empty(unavailable.Alternatives);
    }

    [Fact]
    public void Tie_representative_and_digest_are_deterministic_under_nonsemantic_reordering()
    {
        var fixture = new Fixture([new("B", 1, Disruption: 1), new("A", 1, Disruption: 1), new("Extra", 0)],
            [new("same", 10, [["A"], ["B"]])], budget: 1);
        var first = Run(fixture);
        var request = fixture.Request;
        var reordered = Run(fixture, request with
        {
            Limits = request.Limits with { Staff = request.Limits.Staff.Reverse().ToArray() },
            ScenarioWeights = request.ScenarioWeights.Reverse().ToArray(),
            Estimates = request.Estimates.Reverse().Select(e => e with { Staff = e.Staff!.Reverse().ToArray() }).ToArray(),
        });

        Assert.Equal(first.InputSha256, reordered.InputSha256);
        Assert.NotEqual(first.InputSha256, Run(fixture, maxAlternatives: 1).InputSha256);
        Assert.NotEqual(first.InputSha256, Run(fixture, request with { ObjectiveVersion = "objective-v2" }).InputSha256);
        Assert.Equal(first.Alternatives.Select(a => Vector(a.Plan)), reordered.Alternatives.Select(a => Vector(a.Plan)));
        Assert.Equal(["A"], first.Alternatives[0].Plan.SelectedActionIds);
        Assert.Empty(first.Alternatives[1].Plan.SelectedActionIds);
    }

    [Fact]
    public void Completed_search_distinguishes_output_truncation_from_a_tracking_limit()
    {
        var complete = Run(IndependentActions(6), maxAlternatives: 7);
        Assert.Equal(PortfolioPareto.Status.Complete, complete.Outcome);
        Assert.Equal(64, complete.RetainedAlternatives);
        Assert.Equal(7, complete.Alternatives.Count);
        Assert.True(complete.OutputTruncated);

        var trackingLimited = Run(IndependentActions(9), maxAlternatives: 7);
        Assert.Equal(PortfolioPareto.Status.FrontierLimit, trackingLimited.Outcome);
        Assert.Equal(BoundedRemediationPortfolioOptimizer.MaxTrackedAlternatives, trackingLimited.RetainedAlternatives);
        Assert.Equal(7, trackingLimited.Alternatives.Count);
        Assert.True(trackingLimited.OutputTruncated);
        AssertPairwiseNonDominance(trackingLimited);
    }

    [Fact]
    public void Work_time_and_cancellation_never_become_complete_or_infeasible_claims()
    {
        var fixture = IndependentActions(4);
        var request = fixture.Request;
        var work = Run(fixture, request with { Search = request.Search with { MaxSearchNodes = 1 } });
        var time = Run(fixture, request with { Search = request.Search with { Timeout = TimeSpan.FromMilliseconds(4) } },
            clock: new TestClock(TimeSpan.TicksPerMillisecond));
        using var before = new CancellationTokenSource();
        before.Cancel();
        var cancelled = Run(fixture, token: before.Token);
        using var during = new CancellationTokenSource();
        var interrupted = Run(fixture, clock: new TestClock(onReading: reads =>
        {
            if (reads == 4)
                during.Cancel();
        }), token: during.Token);

        Assert.Equal(PortfolioPareto.Status.WorkLimit, work.Outcome);
        Assert.Equal(1, work.EvaluatedSearchNodes);
        Assert.Single(work.Alternatives);
        Assert.Equal(PortfolioPareto.Status.TimeLimit, time.Outcome);
        Assert.Equal(PortfolioPareto.Status.Cancelled, cancelled.Outcome);
        Assert.Empty(cancelled.Alternatives);
        Assert.Equal(PortfolioPareto.Status.Cancelled, interrupted.Outcome);
        Assert.NotEmpty(interrupted.Alternatives);
        AssertPairwiseNonDominance(interrupted);
    }

    [Fact]
    public void Completed_search_matches_independent_exhaustive_frontiers_on_varied_small_cases()
    {
        var random = new Random(91);

        for (int trial = 0; trial < 96; trial++)
        {
            var actions = Enumerable.Range(0, 7).Select(i =>
                new ActionCase($"A{i}", random.Next(4), random.Next(3), random.Next(2), random.Next(3))).ToArray();
            List<Link> links = [];

            for (int i = 1; i < actions.Length; i++)
            for (int j = 0; j < i; j++)
            {
                int kind = random.Next(8);

                if (kind == 0)
                    links.Add(new(actions[i].Id, actions[j].Id, PortfolioRelationship.Requires));

                if (kind == 1)
                    links.Add(new(actions[i].Id, actions[j].Id, PortfolioRelationship.Conflicts));
            }

            var scenarios = Enumerable.Range(0, 6).Select(i => new ScenarioCase($"S{i}", random.Next(10),
                [[actions[random.Next(7)].Id], [actions[random.Next(3)].Id, actions[random.Next(3, 7)].Id]])).ToArray();
            var fixture = new Fixture(actions, scenarios, links.ToArray(), random.Next(10),
                random.Next(7), random.Next(5), random.Next(7),
                mandatory: trial % 3 == 0 ? [actions[random.Next(7)].Id] : []);
            AssertEqualToOracle(fixture, Run(fixture));
        }
    }

    [Theory]
    [InlineData(8)]
    [InlineData(32)]
    [InlineData(96)]
    public void Compare_bounded_tradeoffs_and_existing_baselines_on_the_same_fixture(int count)
    {
        var actions = Enumerable.Range(0, count).Select(i =>
            new ActionCase($"A{i:D3}", 1 + i % 7, StaffA: i % 3, Disruption: (i * 7) % 11)).ToArray();
        var scenarios = Enumerable.Range(0, count).Select(i => new ScenarioCase($"S{i:D3}", 1 + i % 13,
            [[actions[i].Id], [actions[(i + 1) % count].Id, actions[(i + 3) % count].Id]])).ToArray();
        var fixture = new Fixture(actions, scenarios, budget: count * 2, staffA: count, disruption: count * 2);
        var request = fixture.Request with
        {
            Search = new(2_000, 1_000, TimeSpan.FromSeconds(10)),
        };
        var service = new BoundedRemediationPortfolioOptimizer(TimeProvider.System);
        long start = Stopwatch.GetTimestamp();
        long startingAllocation = GC.GetAllocatedBytesForCurrentThread();
        var pareto = service.OptimizeAlternatives(fixture.Pin, fixture.Graph, new(request, 16));
        long paretoBytes = GC.GetAllocatedBytesForCurrentThread() - startingAllocation;
        double paretoMs = Stopwatch.GetElapsedTime(start).TotalMilliseconds;
        start = Stopwatch.GetTimestamp();
        startingAllocation = GC.GetAllocatedBytesForCurrentThread();
        var baseline = service.Optimize(fixture.Pin, fixture.Graph, request);
        long baselineBytes = GC.GetAllocatedBytesForCurrentThread() - startingAllocation;
        double baselineMs = Stopwatch.GetElapsedTime(start).TotalMilliseconds;

        Assert.InRange(pareto.EvaluatedSearchNodes, 1, 2_000);
        Assert.NotEmpty(pareto.Alternatives);
        Assert.NotNull(baseline.BestFeasiblePlan);
        AssertPairwiseNonDominance(pareto);
        Assert.All(pareto.Alternatives, a =>
            Assert.Equal(Vector(a.Plan), Vector(IndependentEvaluation(fixture, a.Plan.SelectedActionIds.ToArray())!)));

        if (pareto.Outcome == PortfolioPareto.Status.Complete && baseline.Status == PortfolioOptimizationStatus.Optimal)
            Assert.Equal(baseline.BestFeasiblePlan.ModeledCoveragePoints, pareto.Alternatives[0].Plan.ModeledCoveragePoints);

        output.WriteLine($"FND091 actions={count} Pareto={pareto.Outcome} nodes={pareto.EvaluatedSearchNodes} " +
            $"retained={pareto.RetainedAlternatives} returned={pareto.Alternatives.Count} " +
            $"paretoBest={pareto.Alternatives[0].Plan.ModeledCoveragePoints} " +
            $"paretoMs={paretoMs:F2} paretoThreadAllocatedBytes={paretoBytes} " +
            $"singleBest={baseline.BestFeasiblePlan.ModeledCoveragePoints} singleStatus={baseline.Status} " +
            $"topN={baseline.TopN.Plan!.ModeledCoveragePoints} greedy={baseline.Greedy.Plan!.ModeledCoveragePoints} " +
            $"singleAndBaselinesMs={baselineMs:F2} singleAndBaselinesThreadAllocatedBytes={baselineBytes}");
    }

    private static Fixture IndependentActions(int count)
    {
        var actions = Enumerable.Range(0, count).Select(i => new ActionCase($"A{i:D2}", 1 << i)).ToArray();
        var scenarios = Enumerable.Range(0, count).Select(i => new ScenarioCase($"S{i:D2}", 1 << i, [[actions[i].Id]])).ToArray();
        return new Fixture(actions, scenarios, budget: (1 << count) - 1);
    }

    private static PortfolioPareto.Result Run(Fixture fixture, PortfolioOptimizationRequest? request = null, int maxAlternatives = 32,
        PortfolioOptimizationPin? authorized = null, TimeProvider? clock = null, CancellationToken token = default) =>
        new BoundedRemediationPortfolioOptimizer(clock ?? new TestClock())
            .OptimizeAlternatives(authorized ?? fixture.Pin, fixture.Graph, new(request ?? fixture.Request, maxAlternatives), token);

    private static void AssertEqualToOracle(Fixture fixture, PortfolioPareto.Result actual)
    {
        var expected = ExhaustiveFrontier(fixture);

        if (expected.Length == 0)
        {
            Assert.Equal(PortfolioPareto.Status.Infeasible, actual.Outcome);
            Assert.Empty(actual.Alternatives);
            return;
        }

        Assert.Equal(PortfolioPareto.Status.Complete, actual.Outcome);
        Assert.Equal(expected.Length, actual.RetainedAlternatives);
        Assert.False(actual.OutputTruncated);
        Assert.Equal(expected.Select(Vector), actual.Alternatives.Select(a => Vector(a.Plan)));
        Assert.Equal(expected.Length, actual.Alternatives.Count);

        for (int i = 0; i < expected.Length; i++)
        {
            Assert.Equal(expected[i].Actions, actual.Alternatives[i].Plan.SelectedActionIds);
            Assert.Equal(expected[i].Covered, actual.Alternatives[i].Plan.CoveredScenarioIds);
        }
    }

    private static void AssertPairwiseNonDominance(PortfolioPareto.Result result)
    {
        foreach (var alternative in result.Alternatives)
        {
            var b = Vector(alternative.Plan);
            Assert.DoesNotContain(result.Alternatives,
                other => StrictlyDominates(Vector(other.Plan), b));
        }
    }

    // Independent implementation: brute force raw subsets, direct fixture predicates, then a quadratic
    // pairwise filter. It never calls the production model, closure, bounds, tie or coverage code.
    private static OraclePlan[] ExhaustiveFrontier(Fixture fixture)
    {
        List<OraclePlan> feasible = [];

        for (int set = 0; set < (1 << fixture.Actions.Length); set++)
        {
            var ids = fixture.Actions.Where((_, i) => (set & (1 << i)) != 0).Select(row => row.Id).ToArray();

            if (IndependentEvaluation(fixture, ids) is { } modeled)
                feasible.Add(modeled);
        }

        return feasible.Where(a => !feasible.Any(b => StrictlyDominates(Vector(b), Vector(a))))
            .GroupBy(Vector).Select(group => group.OrderBy(p => p.Actions.Length)
                .ThenBy(p => string.Join(",", p.Actions), StringComparer.Ordinal).First())
            .OrderByDescending(p => p.Points).ThenBy(p => p.Cost).ThenBy(p => p.Disruption).ToArray();
    }

    private static OraclePlan? IndependentEvaluation(Fixture fixture, string[] actions)
    {
        var ids = actions.ToHashSet(StringComparer.Ordinal);
        var selected = fixture.Actions.Where(a => ids.Contains(a.Id)).ToArray();
        var request = fixture.Request;

        if (selected.Length != actions.Length || selected.Any(a => !a.Eligible || !a.Cost.HasValue)
            || !request.MandatoryActionIds.All(ids.Contains)
            || selected.Sum(a => a.Cost!.Value) > request.Limits.Cost
            || selected.Sum(a => a.StaffA) > request.Limits.Staff[0].Minutes
            || selected.Sum(a => a.StaffB) > request.Limits.Staff[1].Minutes
            || selected.Sum(a => a.Disruption) > request.Limits.Disruption
            || fixture.Links.Any(link => link.Kind == PortfolioRelationship.Requires
                ? ids.Contains(link.From) && !ids.Contains(link.To)
                : ids.Contains(link.From) && ids.Contains(link.To)))
            return null;

        var covered = fixture.Scenarios.Where(r => r.Reviewed && r.Clauses.Any(clause => clause.All(ids.Contains))).ToArray();
        return new(ids.Order(StringComparer.Ordinal).ToArray(), covered.Select(r => r.Id).Order(StringComparer.Ordinal).ToArray(),
            covered.Sum(r => r.Points), selected.Sum(a => a.Cost!.Value), selected.Sum(a => a.Disruption));
    }

    private static bool StrictlyDominates((long Points, long Cost, long Disruption) a, (long Points, long Cost, long Disruption) b)
    {
        if (a.Points < b.Points || a.Cost > b.Cost || a.Disruption > b.Disruption)
            return false;

        return a.Points > b.Points || a.Cost < b.Cost || a.Disruption < b.Disruption;
    }

    private static (long, long, long) Vector(OraclePlan p) => (p.Points, p.Cost, p.Disruption);
    private static (long, long, long) Vector(PortfolioAdvisoryPlan p) => (p.ModeledCoveragePoints, p.Usage.Cost, p.Usage.Disruption);

    private sealed record OraclePlan(string[] Actions, string[] Covered, long Points, long Cost, long Disruption);
}
