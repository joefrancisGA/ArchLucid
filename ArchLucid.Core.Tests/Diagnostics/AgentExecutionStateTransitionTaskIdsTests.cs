using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Diagnostics;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentExecutionStateTransitionTaskIdsTests
{
    [Fact]
    public void Format_returns_none_when_no_tasks()
    {
        AgentExecutionStateTransitionTaskIds.Format([]).Should().Be("(none)");
    }

    [Fact]
    public void Format_returns_sorted_sanitized_task_ids()
    {
        IReadOnlyList<AgentTask> tasks =
        [
            new AgentTask
            {
                TaskId = "task-b",
                RunId = "run-1",
                AgentType = AgentType.Topology,
                Status = AgentTaskStatus.Created,
            },
            new AgentTask
            {
                TaskId = "task-a",
                RunId = "run-1",
                AgentType = AgentType.Critic,
                Status = AgentTaskStatus.Created,
            },
        ];

        AgentExecutionStateTransitionTaskIds.Format(tasks).Should().Be("task-a,task-b");
    }
}
