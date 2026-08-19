using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SelectiveAgentExecutePlannerTests
{
    [Fact]
    public void ResolveTasksToForce_when_cost_selected_includes_critic_by_default()
    {
        IReadOnlyList<AgentTask> tasks = FourRequiredTasks("run-1");

        IReadOnlyList<AgentTask> forced = SelectiveAgentExecutePlanner.ResolveTasksToForce(
            tasks,
            new SelectiveAgentExecuteRequest { AgentTypes = ["Cost"] });

        forced.Select(static t => t.AgentType)
            .Should()
            .BeEquivalentTo([AgentType.Cost, AgentType.Critic]);
    }

    [Fact]
    public void ResolveTasksToForce_when_include_dependents_false_does_not_add_critic()
    {
        IReadOnlyList<AgentTask> tasks = FourRequiredTasks("run-1");

        IReadOnlyList<AgentTask> forced = SelectiveAgentExecutePlanner.ResolveTasksToForce(
            tasks,
            new SelectiveAgentExecuteRequest
            {
                AgentTypes = ["Cost"],
                IncludeDependents = false,
            });

        forced.Should().ContainSingle(t => t.AgentType == AgentType.Cost);
        forced.Should().NotContain(t => t.AgentType == AgentType.Critic);
    }

    [Fact]
    public void ResolveTasksToForce_accepts_dispatch_key_agent_types()
    {
        IReadOnlyList<AgentTask> tasks = FourRequiredTasks("run-1");

        IReadOnlyList<AgentTask> forced = SelectiveAgentExecutePlanner.ResolveTasksToForce(
            tasks,
            new SelectiveAgentExecuteRequest { AgentTypes = ["cost"], IncludeDependents = false });

        forced.Should().ContainSingle(t => t.AgentType == AgentType.Cost);
    }

    [Fact]
    public void ResolveTasksToForce_throws_when_selection_empty()
    {
        Action act = () => SelectiveAgentExecutePlanner.ResolveTasksToForce(
            FourRequiredTasks("run-1"),
            new SelectiveAgentExecuteRequest());

        act.Should().Throw<InvalidOperationException>().WithMessage("*taskId or agentType*");
    }

    private static IReadOnlyList<AgentTask> FourRequiredTasks(string runId) =>
    [
        new AgentTask { RunId = runId, TaskId = "t-topo", AgentType = AgentType.Topology },
        new AgentTask { RunId = runId, TaskId = "t-cost", AgentType = AgentType.Cost },
        new AgentTask { RunId = runId, TaskId = "t-comp", AgentType = AgentType.Compliance },
        new AgentTask { RunId = runId, TaskId = "t-crit", AgentType = AgentType.Critic },
    ];
}
