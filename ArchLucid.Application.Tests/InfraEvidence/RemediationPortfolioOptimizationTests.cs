using ArchLucid.Application.InfraEvidence.RemediationPortfolio;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RemediationPortfolioOptimizationTests
{
    [Fact]
    public void Shared_coverage_counts_once_and_can_make_top_N_worse()
    {
        var fixture = new Fixture([new("A"), new("B"), new("C")],
            [new("overlap", 5, [["A"], ["B"]]), new("different", 4, [["C"]])], budget: 2);

        var result = fixture.Run();

        Assert.Equal(PortfolioOptimizationStatus.Optimal, result.Status);
        Assert.Equal(["A", "B"], result.TopN.Plan!.SelectedActionIds);
        Assert.Equal(5, result.TopN.Plan.ModeledCoveragePoints);
        Assert.Equal(["A", "C"], result.BestFeasiblePlan!.SelectedActionIds);
        Assert.Equal(["different", "overlap"], result.BestFeasiblePlan.CoveredScenarioIds);
        Assert.Equal(9, result.BestFeasiblePlan.ModeledCoveragePoints);
        Assert.Equal(9, result.UpperBoundPoints);
        Assert.Equal(0, result.OptimalityGapPoints);
        Assert.Equal(Oracle(fixture)!.Selected, result.BestFeasiblePlan.SelectedActionIds);
    }

    [Fact]
    public void Exact_selection_improves_on_both_baselines_on_a_greedy_counterexample()
    {
        var fixture = GreedyCounterexample();
        var result = fixture.Run();

        Assert.Equal(PortfolioOptimizationStatus.Optimal, result.Status);
        Assert.Equal(PortfolioBaselineStatus.Completed, result.TopN.Status);
        Assert.Equal(PortfolioBaselineStatus.Completed, result.Greedy.Status);
        Assert.Equal(8, result.TopN.Plan!.ModeledCoveragePoints);
        Assert.Equal(8, result.Greedy.Plan!.ModeledCoveragePoints);
        Assert.Equal(10, result.BestFeasiblePlan!.ModeledCoveragePoints);
        Assert.Equal(["B", "C"], result.BestFeasiblePlan.SelectedActionIds);
    }

    [Fact]
    public void Joint_clauses_and_transitive_dependencies_are_selected_as_a_bundle()
    {
        var actions = new ActionCase[] { new("A"), new("B"), new("P"), new("Q"), new("Z") };
        var risks = new ScenarioCase[] { new("joint", 20, [["A", "B"]]), new("alternative", 4, [["Z"]]) };
        var relations = new Link[] { new("A", "P", PortfolioRelationship.Requires),
            new("P", "Q", PortfolioRelationship.Requires), new("Z", "B", PortfolioRelationship.Conflicts) };

        var tight = new Fixture(actions, risks, relations, 3).Run();
        var room = new Fixture(actions, risks, relations, 4).Run();

        Assert.Equal(["Z"], tight.BestFeasiblePlan!.SelectedActionIds);
        Assert.Equal(4, tight.BestFeasiblePlan.ModeledCoveragePoints);
        Assert.Equal(["A", "B", "P", "Q"], room.BestFeasiblePlan!.SelectedActionIds);
        Assert.Equal(["A", "B", "P", "Q"], room.Greedy.Plan!.SelectedActionIds);
        Assert.Equal(20, room.BestFeasiblePlan.ModeledCoveragePoints);
    }

    [Fact]
    public void Staffing_is_limited_by_team_and_disruption_is_not_ignored()
    {
        var fixture = new Fixture(
            [new("A", StaffA: 3), new("B", Disruption: 3), new("C", StaffA: 1, StaffB: 2, Disruption: 1),
             new("D", StaffA: 2, StaffB: 1, Disruption: 1)],
            [new("a", 50, [["A"]]), new("b", 40, [["B"]]), new("c", 20, [["C"]]), new("d", 15, [["D"]])],
            budget: 5, staffA: 2, staffB: 2, disruption: 2);

        var result = fixture.Run();

        Assert.Equal(["C"], result.BestFeasiblePlan!.SelectedActionIds);
        Assert.Equal(1, result.BestFeasiblePlan.Usage.Cost);
        Assert.Equal(1, result.BestFeasiblePlan.Usage.Disruption);
        Assert.Equal([new("ops", 1), new("review", 2)], result.BestFeasiblePlan.Usage.Staff);
    }

    [Fact]
    public void Mandatory_actions_are_selected_even_if_unranked_and_without_coverage()
    {
        var fixture = new Fixture([new("A"), new("B"), new("Required")], [new("a", 9, [["A"]])],
            [new("Required", "B", PortfolioRelationship.Requires)], budget: 2, mandatory: ["Required"]);
        var result = fixture.Run(fixture.Request with
        {
            TopN = fixture.Request.TopN with { OrderedFindingIds = [fixture.Finding("A")] },
        });

        Assert.Equal(PortfolioOptimizationStatus.Optimal, result.Status);
        Assert.Equal(["B", "Required"], result.BestFeasiblePlan!.SelectedActionIds);
        Assert.Equal(0, result.BestFeasiblePlan.ModeledCoveragePoints);
        Assert.Equal(["B", "Required"], result.TopN.Plan!.SelectedActionIds);
    }

    [Fact]
    public void Contradictory_or_over_budget_mandatory_actions_are_proven_infeasible()
    {
        var actions = new ActionCase[] { new("A"), new("B") };
        var knownConflict = new Fixture(actions, [], [new("A", "B", PortfolioRelationship.Conflicts)],
            budget: 2, mandatory: ["A", "B"]).Run();
        var knownInfeasibleBudget = new Fixture(actions, [], [new("A", "B", PortfolioRelationship.Requires)],
            budget: 1, mandatory: ["A"]).Run();

        foreach (var result in new[] { knownConflict, knownInfeasibleBudget })
        {
            Assert.Equal(PortfolioOptimizationStatus.Infeasible, result.Status);
            Assert.Null(result.BestFeasiblePlan);
            Assert.Null(result.UpperBoundPoints);
            Assert.Equal(PortfolioBaselineStatus.NotRun, result.Greedy.Status);
        }
    }

    [Fact]
    public void Unknown_cost_excludes_dependents_and_is_not_zero_or_proven_infeasible()
    {
        var fixture = new Fixture([new("A"), new("Missing", Cost: null), new("Z", Cost: 0)],
            [new("dependent", 100, [["A"]]), new("known", 1, [["Z"]])],
            [new("A", "Missing", PortfolioRelationship.Requires)], budget: 0);

        var result = fixture.Run();
        var required = fixture.Run(fixture.Request with { MandatoryActionIds = ["A"] });

        Assert.Equal(PortfolioOptimizationStatus.Optimal, result.Status);
        Assert.Equal(["Z"], result.BestFeasiblePlan!.SelectedActionIds);
        Assert.Contains(new PortfolioIssue("A", "prerequisite_resource_estimate_missing"), result.Issues);
        Assert.Contains(new PortfolioIssue("Missing", "resource_estimate_missing"), result.Issues);
        Assert.Equal(PortfolioOptimizationStatus.InvalidInput, required.Status);
        Assert.Null(required.BestFeasiblePlan);
    }

    [Fact]
    public void Unknown_coverage_stays_unknown_and_covered_zero_weight_scenarios_are_preserved()
    {
        var fixture = new Fixture([new("A"), new("B", Cost: 0)],
            [new("positive", 2, [["A"]]), new("zero", 0, [["A"]]), new("only-zero", 0, [["B"]]),
             new("unknown", 9999, [["B"]], Reviewed: false)]);
        var result = fixture.Run();

        Assert.Equal(["A"], result.BestFeasiblePlan!.SelectedActionIds);
        Assert.Equal(["positive", "zero"], result.BestFeasiblePlan.CoveredScenarioIds);
        Assert.Equal(["unknown"], result.BestFeasiblePlan.UnknownScenarioIds);
        Assert.Equal(2, result.BestFeasiblePlan.ModeledCoveragePoints);
    }

    [Fact]
    public void Wrong_scope_stale_graph_or_ranking_pin_and_incomplete_evidence_do_not_return_plans()
    {
        var fixture = GreedyCounterexample();
        var stale = fixture.Pin with { GraphSha256 = new string('b', 64) };
        var wrongScope = fixture.Pin with { Binding = fixture.Pin.Binding with
        {
            Scope = ProjectSnapshotScopeKey.Create(ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()), Guid.NewGuid()),
        } };
        var service = new BoundedRemediationPortfolioOptimizer(new TestClock());
        var wrongAuthorized = service.Optimize(wrongScope, fixture.Graph, fixture.Request);
        var staleRequest = fixture.Run(fixture.Request with { Pin = stale });
        var staleRank = fixture.Run(fixture.Request with { TopN = fixture.Request.TopN with { Pin = stale } });
        var incomplete = new Fixture([new("A")], [], complete: false).Run();
        var mandatoryUnknown = new Fixture([new("A", Eligible: false)], [], mandatory: ["A"]).Run();

        foreach (var result in new[] { wrongAuthorized, staleRequest, staleRank })
        {
            Assert.Equal(PortfolioOptimizationStatus.InvalidInput, result.Status);
            Assert.Null(result.InputSha256);
            Assert.Null(result.BestFeasiblePlan);
        }
        Assert.Equal(PortfolioOptimizationStatus.GraphUnavailable, incomplete.Status);
        Assert.Equal(PortfolioOptimizationStatus.GraphUnavailable, mandatoryUnknown.Status);
        Assert.Null(incomplete.BestFeasiblePlan);
        Assert.Null(mandatoryUnknown.BestFeasiblePlan);
    }

    [Fact]
    public void Malformed_planning_values_and_missing_objective_weights_fail_closed()
    {
        var fixture = GreedyCounterexample();
        var request = fixture.Request;
        var estimate = request.Estimates[0];
        PortfolioOptimizationRequest[] invalid =
        [
            request with { Limits = request.Limits with { Currency = "usd" } },
            request with { ScenarioWeights = request.ScenarioWeights.Skip(1).ToArray() },
            request with { ScenarioWeights = [new("left", -1), .. request.ScenarioWeights.Skip(1)] },
            request with { Estimates = [estimate with { Cost = new(long.MaxValue, PortfolioEstimateKind.Measured) }] },
            request with { Estimates = [estimate with { Staff = [new("unapproved-team", 1)] }] },
            request with { Estimates = [estimate with { StaffKind = PortfolioEstimateKind.Unknown }] },
            request with { Search = request.Search with { MaxSearchNodes = 0 } },
            request with { TopN = request.TopN with { OrderedFindingIds = [fixture.Finding("A"), fixture.Finding("A")] } },
        ];

        Assert.All(invalid, bad =>
        {
            var result = fixture.Run(bad);
            Assert.Equal(PortfolioOptimizationStatus.InvalidInput, result.Status);
            Assert.Null(result.InputSha256);
            Assert.Null(result.BestFeasiblePlan);
        });
    }

    [Fact]
    public void Captured_ranking_is_projected_by_finding_and_unrelated_rows_do_not_consume_a_slot()
    {
        var fixture = GreedyCounterexample();
        var ranks = PortfolioTopNInput.FromCapturedSecureNowRanking(fixture.Pin, "captured-ranking-v1",
        [
            new() { FindingId = Guid.NewGuid(), TotalScore = 100 },
            new() { FindingId = fixture.Finding("C"), TotalScore = 90 },
            new() { FindingId = fixture.Finding("A"), TotalScore = 80 },
        ], 1);

        var result = fixture.Run(fixture.Request with { TopN = ranks });

        Assert.Equal(["C"], result.TopN.Plan!.SelectedActionIds);
        Assert.Equal(5, result.TopN.Plan.ModeledCoveragePoints);
        Assert.Equal(["B", "C"], result.BestFeasiblePlan!.SelectedActionIds);
    }

    [Fact]
    public void Input_reordering_does_not_change_identity_or_optimal_ties()
    {
        var fixture = new Fixture([new("B"), new("A"), new("C", Cost: 0)],
            [new("same", 10, [["A"], ["B"]])], budget: 1);
        var first = fixture.Run();
        var request = fixture.Request;
        var reordered = fixture.Run(request with
        {
            Limits = request.Limits with { Staff = request.Limits.Staff.Reverse().ToArray() },
            ScenarioWeights = request.ScenarioWeights.Reverse().ToArray(),
            Estimates = request.Estimates.Reverse().Select(row => row with { Staff = row.Staff!.Reverse().ToArray() }).ToArray(),
        });
        var newPolicy = fixture.Run(request with { ConstraintVersion = "limits-v2" });

        Assert.Equal(first.InputSha256, reordered.InputSha256);
        Assert.NotEqual(first.InputSha256, newPolicy.InputSha256);
        Assert.Equal(["A"], first.BestFeasiblePlan!.SelectedActionIds);
        Assert.Equal(first.BestFeasiblePlan.SelectedActionIds, reordered.BestFeasiblePlan!.SelectedActionIds);
    }

    [Fact]
    public void Bounded_search_reports_the_incumbent_and_a_conservative_gap_without_claiming_optimality()
    {
        var fixture = GreedyCounterexample();
        var result = fixture.Run(fixture.Request with { Search = fixture.Request.Search with
        {
            MaxSearchNodes = 1,
            MaxBaselineEvaluations = 1,
        } });
        var answer = Oracle(fixture)!;

        Assert.Equal(PortfolioOptimizationStatus.WorkLimit, result.Status);
        Assert.Equal(PortfolioBaselineStatus.WorkLimit, result.TopN.Status);
        Assert.Equal(PortfolioBaselineStatus.WorkLimit, result.Greedy.Status);
        Assert.Equal(1, result.EvaluatedSearchNodes);
        Assert.InRange(answer.Points, result.BestFeasiblePlan!.ModeledCoveragePoints, result.UpperBoundPoints!.Value);
        Assert.Equal(result.UpperBoundPoints - result.BestFeasiblePlan.ModeledCoveragePoints, result.OptimalityGapPoints);
    }

    [Fact]
    public void Deadline_and_cancellation_never_become_optimality_or_infeasibility_claims()
    {
        var fixture = GreedyCounterexample();
        var shortRun = fixture.Run(fixture.Request with
        {
            Search = fixture.Request.Search with { Timeout = TimeSpan.FromMilliseconds(4) },
        }, new TestClock(TimeSpan.TicksPerMillisecond));
        using var cancelled = new CancellationTokenSource();
        cancelled.Cancel();
        var aborted = fixture.Run(token: cancelled.Token);
        using var midRun = new CancellationTokenSource();
        var interrupted = fixture.Run(clock: new TestClock(onReading: reads =>
        {
            if (reads == 4)
                midRun.Cancel();
        }), token: midRun.Token);

        Assert.Equal(PortfolioOptimizationStatus.TimeLimit, shortRun.Status);
        Assert.Equal(PortfolioBaselineStatus.TimeLimit, shortRun.Greedy.Status);
        Assert.NotNull(shortRun.BestFeasiblePlan);
        Assert.Equal(PortfolioOptimizationStatus.Cancelled, aborted.Status);
        Assert.Null(aborted.BestFeasiblePlan);
        Assert.Equal(PortfolioOptimizationStatus.Cancelled, interrupted.Status);
        Assert.NotNull(interrupted.BestFeasiblePlan);
    }

    [Fact]
    public void The_last_of_128_actions_is_represented_without_overflow()
    {
        var actions = Enumerable.Range(0, 128).Select(i => new ActionCase($"A{i:D3}")).ToArray();
        var fixture = new Fixture(actions, [new("case", 7, [["A127"]])], budget: 2,
            links: [new("A127", "A064", PortfolioRelationship.Requires)]);
        var result = fixture.Run();

        Assert.Equal(PortfolioOptimizationStatus.Optimal, result.Status);
        Assert.Equal(["A064", "A127"], result.BestFeasiblePlan!.SelectedActionIds);
        Assert.Equal(7, result.BestFeasiblePlan.ModeledCoveragePoints);
    }

    [Fact]
    public void Exact_solver_matches_an_independent_exhaustive_oracle_on_varied_small_cases()
    {
        Random random = new(89);
        for (int run = 0; run < 80; run++)
        {
            var actions = Enumerable.Range(0, 7).Select(i =>
                new ActionCase($"A{i}", random.Next(4), random.Next(3), random.Next(2), random.Next(3))).ToArray();
            List<Link> links = [];
            for (int i = 1; i < actions.Length; i++)
            {
                for (int j = 0; j < i; j++)
                {
                    int kind = random.Next(8);
                    if (kind == 0)
                        links.Add(new(actions[i].Id, actions[j].Id, PortfolioRelationship.Requires));
                    if (kind == 1)
                        links.Add(new(actions[i].Id, actions[j].Id, PortfolioRelationship.Conflicts));
                }
            }
            var scenarios = Enumerable.Range(0, 6).Select(i => new ScenarioCase($"S{i}", random.Next(10),
            [
                [actions[random.Next(7)].Id],
                [actions[random.Next(3)].Id, actions[random.Next(3, 7)].Id],
            ])).ToArray();

            var fixture = new Fixture(actions, scenarios, links.ToArray(), random.Next(10),
                random.Next(7), random.Next(5), random.Next(7),
                mandatory: run % 3 == 0 ? [actions[random.Next(7)].Id] : []);
            var answer = Oracle(fixture);
            var actual = fixture.Run();

            if (answer is null)
            {
                Assert.Equal(PortfolioOptimizationStatus.Infeasible, actual.Status);
                Assert.Null(actual.BestFeasiblePlan);
                continue;
            }

            Assert.Equal(PortfolioOptimizationStatus.Optimal, actual.Status);
            Assert.Equal(answer.Points, actual.BestFeasiblePlan!.ModeledCoveragePoints);
            Assert.Equal(answer.Covered, actual.BestFeasiblePlan.CoveredScenarioIds);
            Assert.Equal(answer.Selected, actual.BestFeasiblePlan.SelectedActionIds);
            Assert.Equal(answer.Points, actual.UpperBoundPoints);
            Assert.True(actual.TopN.Plan!.ModeledCoveragePoints <= answer.Points);
            Assert.True(actual.Greedy.Plan!.ModeledCoveragePoints <= answer.Points);
        }
    }

    [Fact]
    public void Relaxing_a_hard_limit_cannot_worsen_the_proven_optimum()
    {
        var fixture = GreedyCounterexample();
        long[] results = Enumerable.Range(0, 4).Select(budget =>
        {
            var request = fixture.Request with { Limits = fixture.Request.Limits with { Cost = budget } };
            var result = fixture.Run(request);
            Assert.Equal(PortfolioOptimizationStatus.Optimal, result.Status);
            return result.BestFeasiblePlan!.ModeledCoveragePoints;
        }).ToArray();

        Assert.Equal([0L, 6L, 10L, 10L], results);
    }

    private static Fixture GreedyCounterexample() => new([new("A"), new("B"), new("C")],
        [new("left", 3, [["A"], ["B"]]), new("right", 3, [["A"], ["C"]]),
         new("unique-b", 2, [["B"]]), new("unique-c", 2, [["C"]])], budget: 2);

    // Deliberately no use of production masks, closure, graph EvaluateSelection, objectives or score helper.
    // Try every subset against direct fixture constraints, then sort the independently derived answers.
    private static Expected? Oracle(Fixture fixture)
    {
        List<Expected> answers = [];
        for (int choice = 0; choice < (1 << fixture.Actions.Length); choice++)
        {
            var chosen = fixture.Actions.Where((_, index) => (choice & (1 << index)) != 0).ToArray();
            var ids = chosen.Select(action => action.Id).ToHashSet(StringComparer.Ordinal);
            if (chosen.Any(row => !row.Eligible || !row.Cost.HasValue)
                || !fixture.Request.MandatoryActionIds.All(ids.Contains)
                || chosen.Sum(value => value.Cost!.Value) > fixture.Request.Limits.Cost
                || chosen.Sum(value => value.StaffA) > fixture.Request.Limits.Staff[0].Minutes
                || chosen.Sum(value => value.StaffB) > fixture.Request.Limits.Staff[1].Minutes
                || chosen.Sum(value => value.Disruption) > fixture.Request.Limits.Disruption)
                continue;
            if (fixture.Links.Any(link => link.Kind == PortfolioRelationship.Requires
                    && ids.Contains(link.From) && !ids.Contains(link.To))
                || fixture.Links.Any(link => link.Kind == PortfolioRelationship.Conflicts
                    && ids.Contains(link.From) && ids.Contains(link.To)))
                continue;

            var covered = fixture.Scenarios.Where(risk => risk.Reviewed
                && risk.Clauses.Any(clause => clause.All(ids.Contains))).ToArray();
            answers.Add(new(ids.Order(StringComparer.Ordinal).ToArray(),
                covered.Select(item => item.Id).Order(StringComparer.Ordinal).ToArray(), covered.Sum(item => item.Points)));
        }

        return answers.OrderByDescending(item => item.Points).ThenBy(item => item.Selected.Length)
            .ThenBy(item => string.Join(",", item.Selected), StringComparer.Ordinal).FirstOrDefault();
    }

    private sealed record ActionCase(string Id, long? Cost = 1, long StaffA = 0, long StaffB = 0, long Disruption = 0, bool Eligible = true);
    private sealed record ScenarioCase(string Id, long Points, string[][] Clauses, bool Reviewed = true);
    private sealed record Link(string From, string To, PortfolioRelationship Kind);
    private sealed record Expected(string[] Selected, string[] Covered, long Points);

    private sealed class Fixture
    {
        private readonly Dictionary<string, Guid> findings;
        internal ActionCase[] Actions { get; }
        internal ScenarioCase[] Scenarios { get; }
        internal Link[] Links { get; }
        internal RemediationPortfolioGraph Graph { get; }
        internal PortfolioOptimizationPin Pin { get; }
        internal PortfolioOptimizationRequest Request { get; }

        internal Fixture(ActionCase[] actions, ScenarioCase[] scenarios, Link[]? links = null, long budget = 10,
            long staffA = 100, long staffB = 100, long disruption = 100, string[]? mandatory = null, bool complete = true)
        {
            Actions = actions;
            Scenarios = scenarios;
            Links = links ?? [];
            findings = actions.Select((row, i) => (row.Id, Finding: new Guid(i + 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)))
                .ToDictionary(row => row.Id, row => row.Finding, StringComparer.Ordinal);
            var scope = ProjectSnapshotScopeKey.Create(ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()), Guid.NewGuid());
            var binding = new PortfolioBinding(scope, new string('a', 64), "policy-v1", "engine-v1", "risk-model-v1");
            Graph = new(binding, new string('b', 64), complete,
                actions.Select(row => new PortfolioActionNode(row.Id, "fix", Guid.Empty, Guid.Empty, Guid.Empty,
                    [findings[row.Id]], [], row.Eligible)),
                [new("cause", [], [], true)],
                scenarios.Select(row => new PortfolioScenarioNode(row.Id, "cause", [], [], row.Reviewed)),
                Links.Select(row => new PortfolioRelationshipEdge(row.From, row.To, row.Kind, [])),
                scenarios.Where(row => row.Reviewed).SelectMany(row =>
                    row.Clauses.Select(clause => new PortfolioCoverageClause(row.Id, clause, []))), []);
            Pin = new(binding, Graph.GraphSha256);
            Request = new(Pin, "objective-v1", "limits-v1", new("USD", budget, [new("ops", staffA), new("review", staffB)], disruption),
                scenarios.Select(row => new PortfolioScenarioWeight(row.Id, row.Points)).ToArray(),
                actions.Select(row => new PortfolioActionEstimate(row.Id, "fixture-estimates-v1",
                    new(row.Cost, row.Cost.HasValue ? PortfolioEstimateKind.Measured : PortfolioEstimateKind.Unknown),
                    [new("ops", row.StaffA), new("review", row.StaffB)], PortfolioEstimateKind.ReviewedEstimate,
                    new(row.Disruption, PortfolioEstimateKind.ApprovedDefault))).ToArray(), mandatory ?? [],
                new(Pin, "ie15-captured-v1", actions.Select(row => findings[row.Id]).ToArray(), Math.Min(2, actions.Length)),
                new(10_000, 1_000, TimeSpan.FromSeconds(1)));
        }

        internal Guid Finding(string id) => findings[id];

        internal PortfolioOptimizationResult Run(PortfolioOptimizationRequest? request = null, TimeProvider? clock = null,
            CancellationToken token = default) =>
            new BoundedRemediationPortfolioOptimizer(clock ?? new TestClock()).Optimize(Pin, Graph, request ?? Request, token);
    }

    private sealed class TestClock(long tickStep = 0, Action<int>? onReading = null) : TimeProvider
    {
        private int reads;
        public override long TimestampFrequency => TimeSpan.TicksPerSecond;
        public override long GetTimestamp()
        {
            onReading?.Invoke(reads);
            return reads++ * tickStep;
        }
    }
}
