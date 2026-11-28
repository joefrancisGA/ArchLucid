using ArchLucid.Application.InfraEvidence.RemediationPortfolio;
using ArchLucid.Core.Scoping;

using static ArchLucid.Application.Tests.InfraEvidence.RemediationPortfolioOptimizationTests;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RemediationPortfolioExplanationTests
{
    [Fact]
    public void Worked_example_explains_distinct_points_mandatory_dependencies_and_remaining_exposure()
    {
        var fixture = WorkedExample();
        var report = Build(fixture, critical: ["other", "unknown"]);
        var best = report.Plans[0];
        var answer = best.Alternative.Plan;

        // Reviewable independent example. Prep and Must cost 1 each. With only 5 more
        // units available, A scores shared + joint (5 + 7), while B scores shared + other (5 + 4).
        Assert.Equal(PortfolioExplanation.Status.Built, report.Status);
        Assert.Equal(PortfolioPareto.Status.Complete, report.Frontier!.Status);
        Assert.Equal(fixture.Pin, report.Pin);
        Assert.Equal(RemediationPortfolioGraph.SchemaVersion, report.GraphVersion);
        Assert.Equal(fixture.Request.ObjectiveVersion, report.ObjectiveVersion);
        Assert.Equal(fixture.Request.ConstraintVersion, report.ConstraintVersion);
        Assert.Equal(fixture.Request.TopN.RankingVersion, report.RankingVersion);
        Assert.Equal(64, report.InputSha256!.Length);
        Assert.Equal(["A", "Must", "Prep"], answer.SelectedActionIds);
        Assert.Equal(12, answer.ModeledCoveragePoints);
        Assert.Equal(7, answer.Usage.Cost);
        Assert.Equal(["joint", "shared"], answer.CoveredScenarioIds);
        Assert.Equal("cause", Row(best, "joint").CauseId);
        Assert.Equal(7, Row(best, "joint").ContributedPoints);
        Assert.Equal(5, Row(best, "shared").ContributedPoints);
        Assert.Equal(PortfolioExplanation.ScenarioState.ModeledUncovered, Row(best, "other").State);
        Assert.Equal(PortfolioExplanation.ScenarioState.Unknown, Row(best, "unknown").State);
        Assert.True(Row(best, "other").Critical);
        Assert.True(Row(best, "unknown").Critical);
        Assert.Equal(0, Row(best, "unknown").ContributedPoints);

        var must = best.Selected.Single(row => row.Id == "Must");
        Assert.True(must.ExplicitlyMandatory);
        Assert.Equal(["Prep"], must.PrerequisiteActionIds);
        Assert.Equal(["cause"], must.ModeledCauseIds);

        var prep = best.Selected.Single(row => row.Id == "Prep");
        Assert.False(prep.ExplicitlyMandatory);
        Assert.True(prep.RequiredByMandatoryClosure);
        Assert.Equal(["Must", "Prep"], prep.RemovedWithAction);
        Assert.Equal(7, prep.ModeledPointsLostOnRemoval);
        Assert.Equal(["cause"], prep.ModeledCauseIds);

        var a = best.Selected.Single(row => row.Id == "A");
        Assert.Equal(12, a.ModeledPointsLostOnRemoval);
        Assert.Equal("fixture-estimates-v1", a.Estimate.BasisId);
        Assert.Equal([new(fixture.Finding("A"), 1)], a.Findings);
        Assert.Contains(new PortfolioPareto.BindingConstraint(PortfolioPareto.ConstraintKind.Cost, null, 7),
            best.Alternative.BindingConstraints);
        Assert.All(report.Plans, plan => Assert.Equal(plan.Alternative.Plan.ModeledCoveragePoints,
            plan.Scenarios.Sum(scenario => scenario.ContributedPoints)));
    }

    [Fact]
    public void Marginal_removal_preserves_shared_coverage_when_another_selected_action_still_covers_it()
    {
        var fixture = WorkedExample();
        var largerBudget = fixture.Request with { Limits = fixture.Request.Limits with { Cost = 12 } };
        var best = Build(fixture, input: largerBudget).Plans[0];

        Assert.Equal(["A", "B", "Must", "Prep"], best.Alternative.Plan.SelectedActionIds);
        Assert.Equal(16, best.Alternative.Plan.ModeledCoveragePoints);
        Assert.Equal(5, Row(best, "shared").ContributedPoints);
        // Removing A loses only the 7-point joint scenario, since B still covers shared.
        Assert.Equal(7, best.Selected.Single(row => row.Id == "A").ModeledPointsLostOnRemoval);
        Assert.Equal(4, best.Selected.Single(row => row.Id == "B").ModeledPointsLostOnRemoval);
    }

    [Fact]
    public void Exclusions_report_relative_blockers_and_distinguish_feasible_zero_gain()
    {
        var fixture = WorkedExample();
        var plan = Build(fixture).Plans[0];
        var b = Excluded(plan, "B");
        Assert.Contains(PortfolioExplanation.AddBlocker.Cost, b.Blockers);
        Assert.Null(b.AdditionalModeledPoints);
        Assert.Equal([new(fixture.Finding("B"), 2)], b.Findings);

        var conflict = Excluded(plan, "C");
        Assert.Contains(PortfolioExplanation.AddBlocker.Conflict, conflict.Blockers);
        Assert.Contains(conflict.Conflicts, pair => pair.FirstActionId == "A" && pair.SecondActionId == "C");
        var gated = Excluded(plan, "Unreviewed");
        Assert.Equal([PortfolioExplanation.AddBlocker.EvidenceUnavailable], gated.Blockers);
        Assert.Equal(["Unreviewed"], gated.UnavailableActionIds);

        var unpriced = Excluded(plan, "Unpriced");
        Assert.Contains(PortfolioExplanation.AddBlocker.EstimateUnavailable, unpriced.Blockers);
        Assert.DoesNotContain(PortfolioExplanation.AddBlocker.Cost, unpriced.Blockers);
        Assert.Contains(new PortfolioIssue("Unpriced", "resource_estimate_missing"), unpriced.EvidenceIssues);

        var fat = Excluded(plan, "ResourceHeavy");
        Assert.Equal([PortfolioExplanation.AddBlocker.Disruption, PortfolioExplanation.AddBlocker.Staffing], fat.Blockers);
        Assert.Contains(new PortfolioPareto.BindingConstraint(PortfolioPareto.ConstraintKind.Staffing, "ops", 3), fat.ExceededLimits);

        var free = Excluded(plan, "Free");
        Assert.Empty(free.Blockers);
        Assert.Equal(PortfolioExplanation.AddFinding.NoAdditionalModeledPoints, free.Finding);
        Assert.Equal(0, free.AdditionalModeledPoints);
    }

    [Fact]
    public void Approved_budget_and_weight_changes_preserve_mandatory_controls_and_compare_on_original_scale()
    {
        var fixture = WorkedExample();
        var report = Build(fixture, cases:
        [
            new("weight", "approved-rationale-2", null, "weight-v2", [new("other", 20)]),
            new("budget", "approved-rationale-1", 12, null, []),
            new("infeasible", "approved-rationale-3", 1, null, []),
        ]);

        Assert.Equal(["budget", "infeasible", "weight"], report.Sensitivities.Select(row => row.Assumptions.Id));
        var budget = report.Sensitivities[0];
        Assert.Equal(PortfolioPareto.Status.Complete, budget.Frontier.Status);
        Assert.Equal(12, budget.Limits.Cost);
        Assert.Equal(fixture.Request.Limits.Disruption, budget.Limits.Disruption);
        Assert.Equal(fixture.Request.Limits.Staff, budget.Limits.Staff);
        // Both A and B now fit. Shared coverage still counts once, so 5 + 7 + 4 = 16.
        Assert.Equal(16, budget.FirstFeasibleAlternative!.Plan.ModeledCoveragePoints);
        Assert.Equal(["B"], budget.Difference!.AddedActionIds);
        Assert.Equal(["other"], budget.Difference.NewlyCoveredScenarioIds);
        Assert.Equal(4, budget.Difference.DeltaPointsOnOriginalScale);
        Assert.Equal(5, budget.Difference.DeltaCost);
        Assert.Equal(1, budget.Difference.DeltaDisruption);
        Assert.Equal(1, budget.Difference.DeltaStaff.Single(row => row.TeamKey == "ops").Minutes);

        var infeasible = report.Sensitivities[1];
        Assert.Equal(PortfolioPareto.Status.Infeasible, infeasible.Frontier.Status);
        Assert.Null(infeasible.FirstFeasibleAlternative);
        Assert.Null(infeasible.Difference);

        var weight = report.Sensitivities[^1];
        // With weight 20 for Other, B wins with 25. On baseline weights it still earns 9.
        Assert.Equal(["B", "Must", "Prep"], weight.FirstFeasibleAlternative!.Plan.SelectedActionIds);
        Assert.Equal(25, weight.FirstFeasibleAlternative.Plan.ModeledCoveragePoints);
        Assert.Equal("weight-v2", weight.ObjectiveVersion);
        Assert.Equal(9, weight.Difference!.PointsOnOriginalScale);
        Assert.Equal(-3, weight.Difference.DeltaPointsOnOriginalScale);
        Assert.Equal(["A"], weight.Difference.RemovedActionIds);
        Assert.Equal(["joint"], weight.Difference.NoLongerCoveredScenarioIds);
        Assert.Empty(report.NotRunSensitivityIds);
    }

    [Fact]
    public void A_relaxed_case_can_produce_a_first_feasible_plan_without_inventing_a_comparison()
    {
        var fixture = WorkedExample();
        var low = fixture.Request with { Limits = fixture.Request.Limits with { Cost = 1 } };
        var report = Build(fixture, input: low, cases: [new("recover", "approved-local", 7, null, [])]);

        Assert.Equal(PortfolioPareto.Status.Infeasible, report.Frontier!.Status);
        Assert.Empty(report.Plans);
        var recovered = Assert.Single(report.Sensitivities);
        Assert.Equal(PortfolioPareto.Status.Complete, recovered.Frontier.Status);
        Assert.NotNull(recovered.FirstFeasibleAlternative);
        Assert.Null(recovered.Difference);
    }

    [Fact]
    public void Partial_and_cancelled_reports_are_honest_and_never_claim_a_first_choice_is_optimal()
    {
        var fixture = WorkedExample();
        var changed = fixture.Request with { Search = fixture.Request.Search with { MaxSearchNodes = 1 } };
        var report = Build(fixture, input: changed, cases: [new("budget", "approved-local", 12, null, [])]);

        Assert.Equal(PortfolioPareto.Status.WorkLimit, report.Frontier!.Status);
        Assert.Equal(PortfolioPareto.Status.WorkLimit, Assert.Single(report.Sensitivities).Frontier.Status);
        var option = Assert.Single(report.Plans);
        var missed = Excluded(option, "A");
        Assert.Equal(PortfolioExplanation.AddFinding.FeasibleAddNotSelected, missed.Finding);
        Assert.Equal(12, missed.AdditionalModeledPoints);
        Assert.Contains("The frontier is incomplete", PortfolioExplanationView.RenderHtml(report), StringComparison.Ordinal);

        using var cancelled = new CancellationTokenSource();
        cancelled.Cancel();
        var stopped = Build(fixture, token: cancelled.Token);
        Assert.Equal(PortfolioExplanation.Status.Cancelled, stopped.Status);
        Assert.Empty(stopped.Plans);
        Assert.Empty(stopped.Sensitivities);
    }

    [Fact]
    public void Scope_and_approval_validation_fail_closed_without_returning_evidence_or_a_plan()
    {
        var fixture = WorkedExample();
        var secondScope = ProjectSnapshotScopeKey.Create(ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()), Guid.NewGuid());
        var wrongScope = fixture.Pin with { Binding = fixture.Pin.Binding with { Scope = secondScope } };
        var stale = fixture.Pin with { GraphSha256 = new string('0', 64) };
        var slow = fixture.Request with { Search = fixture.Request.Search with { Timeout = TimeSpan.FromSeconds(10) } };

        foreach (var bad in new[]
        {
            Build(fixture, authorized: wrongScope),
            Build(fixture, input: fixture.Request with { Pin = stale }),
            Build(fixture, maxPlans: 0),
            Build(fixture, maxPlans: RemediationPortfolioExplanationService.MaxDetailedAlternatives + 1),
            Build(fixture, critical: ["not-in-graph"]),
            Build(fixture, cases: [new("not-approved", "", 12, null, [])]),
            Build(fixture, cases: [new("bad-weight", "approved", null, "weight-v2", [new("other", -1)])]),
            Build(fixture, cases: [new("same-objective", "approved", null, fixture.Request.ObjectiveVersion, [new("other", 1)])]),
            Build(fixture, cases: [new("two-weights", "approved", null, "weight-v2", [new("other", 1), new("other", 2)])]),
            Build(fixture, cases: [new("dup", "approved", 8, null, []), new("dup", "approved", 9, null, [])]),
            Build(fixture, input: slow, cases: [new("one", "approved", 8, null, []), new("two", "approved", 9, null, [])]),
        })
        {
            Assert.Equal(PortfolioExplanation.Status.InvalidInput, bad.Status);
            Assert.Null(bad.Pin);
            Assert.Null(bad.InputSha256);
            Assert.Empty(bad.Plans);
            Assert.Empty(bad.Sensitivities);
        }

        var unavailable = Build(new Fixture([new("A")], [], complete: false),
            cases: [new("no-retry", "approved", 12, null, [])]);
        Assert.Equal(PortfolioPareto.Status.GraphUnavailable, unavailable.Frontier!.Status);
        Assert.Empty(unavailable.Plans);
        Assert.Empty(unavailable.Sensitivities);
        Assert.Equal(["no-retry"], unavailable.NotRunSensitivityIds);
    }

    [Fact]
    public void Equivalent_inputs_have_identical_fingerprints_and_views_and_data_are_encoded()
    {
        var fixture = WorkedExample();
        var request = fixture.Request;
        const string htmlLikeBasis = "<script>alert(1)</script>";
        PortfolioExplanation.ApprovedSensitivityCase[] cases =
        [
            new("budget", htmlLikeBasis, 12, null, []),
            new("weight", "approved", null, "weight-v2", [new("shared", 2), new("other", 20)]),
        ];
        var original = Build(fixture, critical: ["other", "unknown"], cases: cases);
        var reordered = Build(fixture, input: request with
        {
            Limits = request.Limits with { Staff = request.Limits.Staff.Reverse().ToArray() },
            Estimates = request.Estimates.Reverse().ToArray(),
            ScenarioWeights = request.ScenarioWeights.Reverse().ToArray(),
            MandatoryActionIds = request.MandatoryActionIds.Reverse().ToArray(),
        }, critical: ["unknown", "other"], cases: [cases[1] with { WeightOverrides = cases[1].WeightOverrides.Reverse().ToArray() }, cases[0]]);

        Assert.Equal(original.InputSha256, reordered.InputSha256);
        Assert.NotEqual(original.InputSha256, Build(fixture, critical: ["unknown"], cases: cases).InputSha256);

        var html = PortfolioExplanationView.RenderHtml(original);
        Assert.Equal(html, PortfolioExplanationView.RenderHtml(reordered));
        Assert.Contains("&lt;script&gt;", html, StringComparison.Ordinal);
        Assert.DoesNotContain("<script", html, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("<form", html, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Content-Security-Policy", html, StringComparison.Ordinal);
        Assert.Contains("Existing human approval is still required", html, StringComparison.Ordinal);
        Assert.Contains("Scenario score breakdown", html, StringComparison.Ordinal);
        Assert.Contains("Unknown coverage", html, StringComparison.Ordinal);
        Assert.Contains("on the original weight scale", html, StringComparison.Ordinal);
    }

    private static Fixture WorkedExample() => new(
        [new("A", 5, Disruption: 1), new("B", 5, StaffA: 1, Disruption: 1), new("C", 0),
         new("Free", 0), new("Must"), new("Prep"), new("ResourceHeavy", 0, StaffA: 8, Disruption: 9),
         new("Unpriced", Cost: null), new("Unreviewed", Eligible: false)],
        [new("shared", 5, [["A"], ["B"]]), new("joint", 7, [["A", "Must"]]), new("other", 4, [["B"]]),
         new("unknown", 1_000, [["Must"]], Reviewed: false)],
        [new("Must", "Prep", PortfolioRelationship.Requires), new("A", "C", PortfolioRelationship.Conflicts)],
        budget: 7, staffA: 3, disruption: 5, mandatory: ["Must"]);

    private static PortfolioExplanation.Result Build(Fixture fixture, PortfolioOptimizationRequest? input = null,
        IReadOnlyList<string>? critical = null, IReadOnlyList<PortfolioExplanation.ApprovedSensitivityCase>? cases = null,
        PortfolioOptimizationPin? authorized = null, int maxPlans = 8, CancellationToken token = default) =>
        new RemediationPortfolioExplanationService(new TestClock()).Build(authorized ?? fixture.Pin, fixture.Graph,
            new(new(input ?? fixture.Request, maxPlans), critical ?? [], cases ?? []), token);

    private static PortfolioExplanation.Scenario Row(PortfolioExplanation.Plan plan, string id) =>
        plan.Scenarios.Single(row => row.Id == id);

    private static PortfolioExplanation.ExcludedAction Excluded(PortfolioExplanation.Plan plan, string id) =>
        plan.Excluded.Single(row => row.Id == id);
}
