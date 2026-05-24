using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRunExecuteOrchestratorArePersistedResultsCompleteTests
{
    [Fact]
    public void ArePersistedResultsCompleteForTasks_returns_true_when_counts_and_task_ids_match()
    {
        List<AgentTask> tasks =
        [
            new AgentTask { TaskId = "task-a", RunId = "run", AgentType = AgentType.Topology },
            new AgentTask { TaskId = "task-b", RunId = "run", AgentType = AgentType.Cost },
        ];

        List<AgentResult> results =
        [
            new AgentResult { TaskId = "task-a", RunId = "run", AgentType = AgentType.Topology },
            new AgentResult { TaskId = "task-b", RunId = "run", AgentType = AgentType.Cost },
        ];

        ArchitectureRunExecuteOrchestrator.ArePersistedResultsCompleteForTasks(tasks, results).Should().BeTrue();
    }

    [Fact]
    public void ArePersistedResultsCompleteForTasks_returns_false_when_result_count_differs()
    {
        List<AgentTask> tasks =
        [
            new AgentTask { TaskId = "task-a", RunId = "run", AgentType = AgentType.Topology },
        ];

        List<AgentResult> results =
        [
            new AgentResult { TaskId = "task-a", RunId = "run", AgentType = AgentType.Topology },
            new AgentResult { TaskId = "task-b", RunId = "run", AgentType = AgentType.Cost },
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
            new AgentResult { TaskId = "task-a", RunId = "run", AgentType = AgentType.Topology },
            new AgentResult { TaskId = "task-c", RunId = "run", AgentType = AgentType.Compliance },
        ];

        ArchitectureRunExecuteOrchestrator.ArePersistedResultsCompleteForTasks(tasks, results).Should().BeFalse();
    }
}
