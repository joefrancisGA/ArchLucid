using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRunExecuteOrchestratorArePersistedResultsCompleteTests
{
    [Fact]
    public void ArePersistedResultsCompleteForTasks_returns_true_when_each_task_has_skippable_result()
    {
        List<AgentTask> tasks =
        [
            new AgentTask { TaskId = "task-a", RunId = "run", AgentType = AgentType.Topology },
            new AgentTask { TaskId = "task-b", RunId = "run", AgentType = AgentType.Cost },
        ];

        List<AgentResult> results =
        [
            new AgentResult
            {
                TaskId = "task-a",
                RunId = "run",
                AgentType = AgentType.Topology,
                Claims = ["topology done"],
            },
            new AgentResult
            {
                TaskId = "task-b",
                RunId = "run",
                AgentType = AgentType.Cost,
                Confidence = 0.8,
            },
        ];

        ArchitectureRunExecuteOrchestrator.ArePersistedResultsCompleteForTasks(tasks, results).Should().BeTrue();
    }

    [Fact]
    public void ArePersistedResultsCompleteForTasks_returns_false_when_result_count_differs()
    {
        List<AgentTask> tasks =
        [
            new AgentTask { TaskId = "task-a", RunId = "run", AgentType = AgentType.Topology },
            new AgentTask { TaskId = "task-b", RunId = "run", AgentType = AgentType.Cost },
        ];

        List<AgentResult> results =
        [
            new AgentResult
            {
                TaskId = "task-a",
                RunId = "run",
                AgentType = AgentType.Topology,
                Claims = ["topology done"],
            },
        ];

        ArchitectureRunExecuteOrchestrator.ArePersistedResultsCompleteForTasks(tasks, results).Should().BeFalse();
    }

    [Fact]
    public void ArePersistedResultsCompleteForTasks_returns_false_when_task_id_missing_from_results()
    {
        List<AgentTask> tasks =
        [
            new AgentTask { TaskId = "task-a", RunId = "run", AgentType = AgentType.Topology },
            new AgentTask { TaskId = "task-b", RunId = "run", AgentType = AgentType.Cost },
        ];

        List<AgentResult> results =
        [
            new AgentResult
            {
                TaskId = "task-a",
                RunId = "run",
                AgentType = AgentType.Topology,
                Claims = ["topology done"],
            },
            new AgentResult
            {
                TaskId = "task-c",
                RunId = "run",
                AgentType = AgentType.Compliance,
                Claims = ["other"],
            },
        ];

        ArchitectureRunExecuteOrchestrator.ArePersistedResultsCompleteForTasks(tasks, results).Should().BeFalse();
    }

    [Fact]
    public void ArePersistedResultsCompleteForTasks_returns_false_when_any_result_is_degraded()
    {
        List<AgentTask> tasks =
        [
            new AgentTask { TaskId = "task-a", RunId = "run", AgentType = AgentType.Topology },
            new AgentTask { TaskId = "task-b", RunId = "run", AgentType = AgentType.Cost },
        ];

        List<AgentResult> results =
        [
            new AgentResult
            {
                TaskId = "task-a",
                RunId = "run",
                AgentType = AgentType.Topology,
                Claims = ["topology done"],
            },
            new AgentResult
            {
                TaskId = "task-b",
                RunId = "run",
                AgentType = AgentType.Cost,
                Claims = ["degraded placeholder"],
                DegradationReasonCode = AgentHandlerDegradationReasonCodes.CircuitOpen,
            },
        ];

        ArchitectureRunExecuteOrchestrator.ArePersistedResultsCompleteForTasks(tasks, results).Should().BeFalse();
    }
}
