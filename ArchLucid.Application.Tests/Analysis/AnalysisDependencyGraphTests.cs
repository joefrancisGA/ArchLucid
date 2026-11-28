using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AnalysisDependencyGraphTests
{
    [Fact]
    public void Changed_stage_invalidates_a_diamond_in_dependency_order_once()
    {
        AnalysisDependencyGraph graph = new("diamond/v1",
            new("join", ["join_input"], "left", "right"),
            new("unrelated", ["other"]),
            new("right", ["right_input"], "root"),
            new("left", ["left_input"], "root"),
            new("root", ["root_input"]));

        var plan = graph.Plan(new Dictionary<string, AnalysisDependencyDecision>
        {
            ["root"] = new(AnalysisDependencyAction.Recompute, "stale_dependencies"),
        });

        Assert.Equal(["root", "left", "right", "join", "unrelated"], graph.Order);
        Assert.Equal(AnalysisDependencyAction.Recompute, plan["join"].Action);
        Assert.Equal("upstream_invalidated", plan["join"].Reason);
        Assert.Equal(AnalysisDependencyAction.Reuse, plan["unrelated"].Action);
    }

    [Fact]
    public void Failed_upstream_blocks_dependents_without_blocking_other_work()
    {
        var graph = AnalysisDependencyGraphs.SecureFull;
        var plan = graph.Plan(new Dictionary<string, AnalysisDependencyDecision>
        {
            ["securenow.privilege"] = new(AnalysisDependencyAction.Blocked, "incomplete_engine_coverage"),
        });

        Assert.Equal(AnalysisDependencyAction.Blocked, plan["securenow.toxic"].Action);
        Assert.Equal(AnalysisDependencyAction.Blocked, plan[AnalysisDependencyGraphs.Job].Action);
        Assert.Equal(AnalysisDependencyAction.Reuse, plan["securenow.reachability"].Action);
        Assert.Equal(AnalysisDependencyAction.Reuse, plan["securenow.capability_flow"].Action);
    }

    [Fact]
    public void Ranking_policy_change_does_not_invalidate_verified_paths_in_either_route()
    {
        foreach (var graph in new[] { AnalysisDependencyGraphs.SecureFull, AnalysisDependencyGraphs.SecureCarry })
        {
            var plan = graph.Plan(new Dictionary<string, AnalysisDependencyDecision>
            {
                ["securenow.ranking"] = new(AnalysisDependencyAction.Recompute, "stale_dependencies"),
            });

            Assert.Equal(AnalysisDependencyAction.Recompute, plan["securenow.cut_point"].Action);
            Assert.Equal(AnalysisDependencyAction.Recompute, plan[AnalysisDependencyGraphs.Job].Action);
            Assert.Equal(AnalysisDependencyAction.Reuse, plan["securenow.drift"].Action);
            Assert.Equal(AnalysisDependencyAction.Reuse, plan[AnalysisDependencyGraphs.Plan].Action);
        }

        Assert.DoesNotContain("securenow.privilege", AnalysisDependencyGraphs.SecureCarry.Order);
    }

    [Fact]
    public void Unknown_seeds_trigger_wider_invalidation_and_bad_topologies_are_rejected()
    {
        var graph = AnalysisDependencyGraphs.Authority;
        var plan = graph.Plan(new Dictionary<string, AnalysisDependencyDecision>
        {
            ["unclassified_input"] = new(AnalysisDependencyAction.Recompute, "stale_dependencies"),
        });

        Assert.All(plan.Values, decision => Assert.Equal(AnalysisDependencyAction.Recompute, decision.Action));
        Assert.Throws<ArgumentException>(() => new AnalysisDependencyGraph("bad", new AnalysisDependencyStage("first", [], "missing")));
        Assert.Throws<ArgumentException>(() => new AnalysisDependencyGraph("cycle", new("first", [], "second"),
            new("second", [], "first")));
    }

    [Fact]
    public void Missing_prerequisite_is_only_observed_in_shadow_and_blocks_in_enforce()
    {
        var execution = new AnalysisDependencyExecution(AnalysisDependencyGraphs.Authority, Scope(), Guid.NewGuid());
        const string stage = AuthorityPipelineStageNames.Findings;
        var binding = execution.Bind(stage, "same-input");

        Assert.Equal("context_ingestion", binding.MissingStage);
        Assert.Equal(AnalysisDependencyAction.Blocked, execution.Observe(stage, binding, null, true, false, NullLogger.Instance).Action);
        var failure = Assert.Throws<AnalysisDependencyRejectionException>(() =>
            execution.Observe(stage, binding, null, true, true, NullLogger.Instance));
        Assert.Equal("incomplete_engine_coverage", failure.Reason);
    }

    [Fact]
    public void Exact_bindings_change_across_graph_versions_attempts_runs_and_projects()
    {
        var scope = Scope();
        var sameTenantOtherProject = ProjectScopeKey.Create(scope.TenantId, scope.WorkspaceId, Guid.NewGuid());
        Guid run = Guid.NewGuid();
        var first = new AnalysisDependencyGraph("one", new("a", ["policy"]), new("b", ["config"], "a"));
        var second = new AnalysisDependencyGraph("two", new("a", ["policy"]), new("b", ["config"], "a"));
        string baseline = Bind(first, scope, run, 1);

        Assert.Equal(baseline, Bind(first, scope, run, 1));
        Assert.NotEqual(baseline, Bind(first, scope, run, 2));
        Assert.NotEqual(baseline, Bind(first, sameTenantOtherProject, run, 1));
        Assert.NotEqual(baseline, Bind(first, scope, Guid.NewGuid(), 1));
        Assert.NotEqual(baseline, Bind(second, scope, run, 1));

        static string Bind(AnalysisDependencyGraph graph, ProjectScopeKey scope, Guid run, long fence)
        {
            var execution = new AnalysisDependencyExecution(graph, scope, run);
            execution.Record("a", "same-version", "same-result", fence);
            return execution.Bind("b", "same-input").InputVersion;
        }
    }

    private static ProjectScopeKey Scope() => ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
}
