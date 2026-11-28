using ArchLucid.Application.InfraEvidence.RemediationPortfolio;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Time.Testing;

using static ArchLucid.Application.InfraEvidence.RemediationPortfolio.PortfolioControlState;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RemediationPortfolioImpactTests
{
    private const string Scenario = "scenario";
    private static string Reference => new('A', 64);

    [Fact]
    public void Closing_one_observation_does_not_remove_a_scenario_when_an_alternative_remains()
    {
        var fixture = new Fixture();
        var result = fixture.Run(fixture.Select("A"));

        Assert.Equal(PortfolioImpactStatus.Modeled, result.Status);
        Assert.True(result.FullComparisonPassed);
        Assert.True(result.IsModeledOnly);
        var impact = Assert.Single(result.Scenarios);
        Assert.Equal(PortfolioExposureDelta.Remaining, impact.Delta);
        Assert.Equal(PortfolioExposureDelta.Removed, Observation(impact, "first").Delta);
        Assert.Equal(PortfolioExposureDelta.Remaining, Observation(impact, "second").Delta);
        Assert.Equal(Reference, Observation(impact, "second").EvidenceSha256);
    }

    [Fact]
    public void Complementary_effects_remove_both_observations_without_modifying_baseline()
    {
        var fixture = new Fixture();
        var plan = fixture.Select("B", "A");
        string before = RemediationPortfolioImpactEvaluator.CaptureSha256(fixture.Capture);

        var result = fixture.Run(plan);
        var replay = fixture.Run(plan);

        Assert.Equal(PortfolioImpactStatus.Modeled, result.Status);
        Assert.Equal(PortfolioExposureDelta.Removed, Assert.Single(result.Scenarios).Delta);
        Assert.Equal(before, result.BaselineSha256);
        Assert.NotEqual(result.BaselineSha256, result.ProposedSha256);
        Assert.Equal(result.ProposedSha256, replay.ProposedSha256);
        Assert.Equal(result.PlanSha256, replay.PlanSha256);
        Assert.Equal(before, RemediationPortfolioImpactEvaluator.CaptureSha256(fixture.Capture));
        Assert.All(fixture.Capture.Controls, row => Assert.Equal(NotEnforced, row.State));
    }

    [Fact]
    public void Independently_full_recomputed_model_detects_a_new_declared_observation()
    {
        var fixture = new Fixture();
        var capture = fixture.Capture with
        {
            Scenarios = [.. fixture.Capture.Scenarios,
                new("side-effect", true, [Observe("separate", new("first-control", Enforced), new("second-control", NotEnforced))])],
        };
        var result = fixture.Run(fixture.Select("A"), capture);

        Assert.Equal(PortfolioImpactStatus.Modeled, result.Status);
        Assert.True(result.FullComparisonPassed);
        Assert.Equal(PortfolioExposureDelta.Introduced,
            Assert.Single(result.Scenarios, row => row.ScenarioId == "side-effect").Delta);
        Assert.Equal(PortfolioExposureDelta.Remaining,
            Assert.Single(result.Scenarios, row => row.ScenarioId == Scenario).Delta);
    }

    [Fact]
    public void A_new_observation_is_visible_even_when_its_scenario_remains_present()
    {
        var fixture = new Fixture();
        var scenario = Assert.Single(fixture.Capture.Scenarios);
        var amended = fixture.Capture with
        {
            Scenarios = [scenario with
            {
                Observations = [.. scenario.Observations, Observe("side-effect", new PortfolioExposureCondition("first-control", Enforced))],
            }],
        };
        var impact = Assert.Single(fixture.Run(fixture.Select("A"), amended).Scenarios);

        Assert.Equal(PortfolioExposureDelta.Remaining, impact.Delta);
        Assert.Equal(PortfolioExposureDelta.Introduced, Observation(impact, "side-effect").Delta);
    }

    [Fact]
    public void Incomplete_or_missing_coverage_never_becomes_a_scenario_removal_or_new_baseline_absence()
    {
        var fixture = new Fixture();
        var complete = fixture.Run(fixture.Select("A", "B"));
        var partial = fixture.Run(fixture.Select("A", "B"), fixture.Capture with { CoverageComplete = false });
        var noRoster = fixture.Run(fixture.Select("A", "B"), fixture.Capture with { Scenarios = [] });
        var emptyObservations = fixture.Run(fixture.Select("A", "B"), fixture.Capture with { Scenarios = [new(Scenario, true, [])] });

        Assert.Equal(PortfolioExposureDelta.Removed, Assert.Single(complete.Scenarios).Delta);
        foreach (var result in new[] { partial, noRoster, emptyObservations })
        {
            Assert.Equal(PortfolioImpactStatus.IncompleteCoverage, result.Status);
            Assert.True(result.FullComparisonPassed);
            Assert.Equal(PortfolioExposureDelta.Unknown, Assert.Single(result.Scenarios).Delta);
        }
        Assert.Contains(partial.Issues, row => row.Reason == "capture_observation_coverage_incomplete");
        Assert.Contains(noRoster.Issues, row => row.Reason == "scenario_missing_from_reviewed_observation_roster");
    }

    [Fact]
    public void Unknown_control_stays_unknown_and_cannot_satisfy_an_effect_precondition()
    {
        var fixture = new Fixture();
        var incomplete = fixture.Capture with
        {
            Controls = [new("first-control", NotEnforced), new("second-control", Unknown)],
        };

        var result = fixture.Run(fixture.Select("A"), incomplete);
        var blocked = fixture.Run(fixture.Select("B"), incomplete);

        Assert.Equal(PortfolioImpactStatus.IncompleteCoverage, result.Status);
        var impact = Assert.Single(result.Scenarios);
        Assert.Equal(PortfolioExposureState.Present, impact.Baseline);
        Assert.Equal(PortfolioExposureState.Unknown, impact.Proposed);
        Assert.Equal(PortfolioExposureDelta.Unknown, impact.Delta);
        Assert.Equal(PortfolioImpactStatus.IncompleteCoverage, blocked.Status);
        Assert.Null(blocked.ProposedSha256);
        Assert.Empty(blocked.Scenarios);
    }

    [Fact]
    public void Invalid_graph_selection_stale_state_unsupported_and_ambiguous_effects_fail_atomically()
    {
        var fixture = new Fixture();
        var original = fixture.Select("A");
        var needsPrerequisite = new Fixture([new("A", "B", PortfolioRelationship.Requires, [])]);
        var stale = fixture.Run(original, fixture.Capture with
        {
            Controls = [new("first-control", Enforced), new("second-control", NotEnforced)],
        });
        var unsupported = fixture.Run(original with { Effects = [] });
        var undeclared = fixture.Run(original with { Effects = [Effect("A", "not-in-the-model")] });
        var collision = fixture.Run(fixture.Select("A", "B") with { Effects = [Effect("A", "first-control"), Effect("B", "first-control")] });

        AssertFailed(needsPrerequisite.Run(needsPrerequisite.Select("A")), PortfolioImpactStatus.InfeasiblePlan);
        AssertFailed(stale, PortfolioImpactStatus.StaleInput);
        AssertFailed(unsupported, PortfolioImpactStatus.UnsupportedEffect);
        AssertFailed(undeclared, PortfolioImpactStatus.UnsupportedEffect);
        AssertFailed(collision, PortfolioImpactStatus.UnsupportedEffect);
        Assert.All(fixture.Capture.Controls, row => Assert.Equal(NotEnforced, row.State));
    }

    [Fact]
    public void Foreign_scope_stale_configuration_changed_evidence_and_stale_plan_have_no_result()
    {
        var fixture = new Fixture();
        var other = new Fixture();
        var plan = fixture.Select("A");
        var pin = fixture.Review(plan);
        var policyChanged = fixture.Pin with { Binding = fixture.Pin.Binding with { PolicyVersion = "policy-v2" } };

        var wrongScope = fixture.Run(plan, authorized: other.Review(other.Select("A")));
        var wrongPolicy = fixture.Run(plan, authorized: pin with { Portfolio = policyChanged });
        var replacedObservation = fixture.Run(plan, fixture.Capture with { ObservationModelVersion = "observations-v2" },
            authorized: pin);
        var alteredSelection = fixture.Run(fixture.Select("B"), authorized: pin);

        AssertFailed(wrongScope, PortfolioImpactStatus.InvalidInput);
        AssertFailed(wrongPolicy, PortfolioImpactStatus.InvalidInput);
        AssertFailed(replacedObservation, PortfolioImpactStatus.StaleInput);
        AssertFailed(alteredSelection, PortfolioImpactStatus.StaleInput);
        Assert.Null(wrongScope.BaselineSha256);
        Assert.Null(wrongScope.PlanSha256);
    }

    [Fact]
    public void Malformed_capture_cannot_assert_absence_via_empty_conditions_duplicate_ids_or_unknown_control()
    {
        var fixture = new Fixture();
        var plan = fixture.Select("A");
        var pin = fixture.Review(plan);
        var baseScenario = Assert.Single(fixture.Capture.Scenarios);
        var reviewed = baseScenario.Observations[0];
        PortfolioExposureObservation[][] invalid =
        [
            [reviewed with { AllConditions = [] }],
            [reviewed, reviewed with { EvidenceSha256 = new string('B', 64) }],
            [Observe("unbound", new PortfolioExposureCondition("absent-control", NotEnforced))],
        ];
        foreach (var observations in invalid)
        {
            var malformed = fixture.Capture with { Scenarios = [baseScenario with { Observations = observations }] };
            AssertFailed(fixture.Run(plan, malformed, authorized: pin), PortfolioImpactStatus.InvalidInput);
        }
    }

    [Fact]
    public void Incomplete_portfolio_graph_blocks_the_simulation_before_comparison()
    {
        var fixture = new Fixture(completeGraph: false);
        AssertFailed(fixture.Run(fixture.Select("A")), PortfolioImpactStatus.IncompleteCoverage);
    }

    [Fact]
    public void Work_time_and_cancellation_limits_do_not_publish_partial_results()
    {
        var fixture = new Fixture();
        var plan = fixture.Select("A", "B");
        var workLimited = fixture.Run(plan, limits: new(5, TimeSpan.FromSeconds(1)));
        var timedOut = fixture.Run(plan, limits: new(100, TimeSpan.FromMilliseconds(5)),
            clock: new StepClock());
        using var cancellation = new CancellationTokenSource();
        var interrupted = fixture.Run(plan, clock: new StepClock(read =>
        {
            if (read == 7)
                cancellation.Cancel();
        }), cancellationToken: cancellation.Token);

        AssertFailed(workLimited, PortfolioImpactStatus.WorkLimit);
        AssertFailed(timedOut, PortfolioImpactStatus.TimeLimit);
        AssertFailed(interrupted, PortfolioImpactStatus.Cancelled);
        Assert.Equal(5, workLimited.Work);
        Assert.All(fixture.Capture.Controls, row => Assert.Equal(NotEnforced, row.State));
    }

    [Fact]
    public void Independent_reference_mismatch_withholds_even_a_plausible_modeled_improvement()
    {
        var fixture = new Fixture();
        var plan = fixture.Select("A", "B");
        var pin = fixture.Review(plan);
        var result = fixture.Run(plan);
        Dictionary<string, PortfolioExposureState> original = new()
        {
            ["first"] = PortfolioExposureState.Present, ["second"] = PortfolioExposureState.Present,
        };
        Dictionary<string, PortfolioExposureState> incremental = new()
        {
            ["first"] = PortfolioExposureState.AbsentWithinCoverage, ["second"] = PortfolioExposureState.AbsentWithinCoverage,
        };
        Dictionary<string, PortfolioExposureState> full = new(incremental)
        {
            ["second"] = PortfolioExposureState.Present,
        };
        var clock = new FakeTimeProvider();
        var work = new PortfolioImpactWork(clock, clock.GetTimestamp(), new(1_000, TimeSpan.FromSeconds(1)), default);
        var mismatch = RemediationPortfolioImpactEvaluator.Reconcile(fixture.Graph, fixture.Capture, pin.CaptureSha256,
            result.ProposedSha256!, pin.PlanSha256, original, incremental, original, full, work);

        AssertFailed(mismatch, PortfolioImpactStatus.VerificationMismatch);
        Assert.Contains(mismatch.Issues, row => row.Reason == "incremental_and_independent_full_observations_disagree");
    }

    [Fact]
    public void Reordering_reviewed_inputs_preserves_hashes_but_changing_effect_evidence_does_not()
    {
        var fixture = new Fixture();
        var plan = fixture.Select("A", "B");
        var pin = fixture.Review(plan);
        var reordered = fixture.Capture with
        {
            Controls = fixture.Capture.Controls.Reverse().ToArray(),
            Scenarios = [.. fixture.Capture.Scenarios.Select(item => item with { Observations = item.Observations.Reverse().ToArray() })],
        };
        var reorderedPlan = plan with { Effects = plan.Effects.Reverse().ToArray(), SelectedActionIds = ["B", "A"] };
        var changed = reorderedPlan with
        {
            Effects = [Effect("A", "first-control") with { EvidenceSha256 = new string('B', 64) }, Effect("B", "second-control")],
        };

        Assert.Equal(pin.CaptureSha256, RemediationPortfolioImpactEvaluator.CaptureSha256(reordered));
        Assert.Equal(pin.PlanSha256, RemediationPortfolioImpactEvaluator.PlanSha256(reorderedPlan));
        Assert.Equal(PortfolioImpactStatus.Modeled, fixture.Run(reorderedPlan, reordered, authorized: pin).Status);
        AssertFailed(fixture.Run(changed, authorized: pin), PortfolioImpactStatus.StaleInput);
    }

    [Fact]
    public void Uses_a_real_optimizer_advisory_selection_without_inheriting_its_coverage_claim()
    {
        var fixture = new Fixture();
        var request = new PortfolioOptimizationRequest(fixture.Pin, "objective", "constraints", new("USD", 1, [], 0), [new(Scenario, 10)],
            [new("A", "review", new(1, PortfolioEstimateKind.Measured), [], PortfolioEstimateKind.Measured, new(0, PortfolioEstimateKind.Measured)),
             new("B", "review", new(1, PortfolioEstimateKind.Measured), [], PortfolioEstimateKind.Measured, new(0, PortfolioEstimateKind.Measured))],
            [], new(fixture.Pin, "rank", [], 1), new(20, 20, TimeSpan.FromSeconds(1)));
        var optimization = new BoundedRemediationPortfolioOptimizer(new FakeTimeProvider()).Optimize(fixture.Pin, fixture.Graph, request);
        var plan = PortfolioImpactPlan.FromAdvisoryPlan(fixture.Pin, optimization, [Effect("A", "first-control")]);
        var impact = fixture.Run(plan);

        Assert.Equal(PortfolioOptimizationStatus.Optimal, optimization.Status);
        Assert.Equal(Scenario, Assert.Single(optimization.BestFeasiblePlan!.CoveredScenarioIds));
        Assert.Equal(optimization.InputSha256, plan.OptimizerInputSha256);
        Assert.Equal("A", Assert.Single(plan.SelectedActionIds));
        Assert.Equal(PortfolioExposureDelta.Remaining, Assert.Single(impact.Scenarios).Delta);
    }

    private static void AssertFailed(PortfolioImpactResult result, PortfolioImpactStatus expected)
    {
        Assert.Equal(expected, result.Status);
        Assert.False(result.FullComparisonPassed);
        Assert.Null(result.ProposedSha256);
        Assert.Empty(result.Scenarios);
    }

    private static PortfolioObservationImpact Observation(PortfolioScenarioImpact scenario, string id) =>
        Assert.Single(scenario.Observations, row => row.ObservationId == id);

    private static PortfolioExposureObservation Observe(string id, params PortfolioExposureCondition[] conditions) =>
        new(id, Reference, conditions);

    private static PortfolioModeledEffect Effect(string id, string control) =>
        new(id, Reference, [new(control, NotEnforced, Enforced)]);

    private sealed class Fixture
    {
        internal RemediationPortfolioGraph Graph { get; }
        internal PortfolioOptimizationPin Pin { get; }
        internal PortfolioImpactCapture Capture { get; }

        internal Fixture(PortfolioRelationshipEdge[]? edges = null, bool completeGraph = true)
        {
            var scope = ProjectSnapshotScopeKey.Create(ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()), Guid.NewGuid());
            var binding = new PortfolioBinding(scope, Reference, "policy", "engine", "risk-model");
            Graph = new(binding, Reference, completeGraph,
                [new("A", "defensive-control", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), [], [], true),
                 new("B", "defensive-control", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), [], [], true)],
                [], [new(Scenario, "cause", [], [], true)], edges ?? [], [new(Scenario, ["A"], [])], []);
            Pin = new(binding, Graph.GraphSha256);
            Capture = new(Pin, "observations-v1", true,
                [new("first-control", NotEnforced), new("second-control", NotEnforced)], [new(Scenario, true,
                    [Observe("first", new PortfolioExposureCondition("first-control", NotEnforced)),
                     Observe("second", new PortfolioExposureCondition("second-control", NotEnforced))])]);
        }

        internal PortfolioImpactPlan Select(params string[] ids) =>
            new(Pin, null, ids, ids.Select(id => Effect(id, id == "A" ? "first-control" : "second-control")).ToArray());

        internal PortfolioImpactPin Review(PortfolioImpactPlan plan, PortfolioImpactCapture? capture = null) =>
            new(Pin, RemediationPortfolioImpactEvaluator.CaptureSha256(capture ?? Capture),
                RemediationPortfolioImpactEvaluator.PlanSha256(plan));

        internal PortfolioImpactResult Run(PortfolioImpactPlan plan, PortfolioImpactCapture? capture = null,
            PortfolioImpactPin? authorized = null, PortfolioImpactLimits? limits = null,
            TimeProvider? clock = null, CancellationToken cancellationToken = default) =>
            new RemediationPortfolioImpactEvaluator(clock ?? new FakeTimeProvider()).Evaluate(authorized ?? Review(plan, capture),
                Graph, capture ?? Capture, plan, limits ?? new(10_000, TimeSpan.FromSeconds(1)), cancellationToken);
    }

    private sealed class StepClock(Action<int>? onRead = null) : TimeProvider
    {
        private int reads;
        public override long TimestampFrequency => TimeSpan.TicksPerSecond;
        public override long GetTimestamp()
        {
            onRead?.Invoke(reads);
            return reads++ * TimeSpan.TicksPerMillisecond;
        }
    }
}
