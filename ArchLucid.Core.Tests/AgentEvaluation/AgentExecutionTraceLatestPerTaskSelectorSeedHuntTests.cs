using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AgentEvaluation;

[Trait("Category", "Unit")]
public sealed class AgentExecutionTraceLatestPerTaskSelectorSeedHuntTests
{
    [Fact]
    public void Select_whitespace_task_id_collapses_with_empty_task_id_for_same_agent()
    {
        DateTime sharedUtc = new(2026, 9, 3, 12, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace whitespaceTask = new()
        {
            TraceId = "trace-whitespace-task",
            TaskId = "   ",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 0,
        };
        AgentExecutionTrace emptyTaskRetry = new()
        {
            TraceId = "trace-empty-task-retry",
            TaskId = string.Empty,
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 2,
        };

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([whitespaceTask, emptyTaskRetry]);

        latest.Should().HaveCount(2);
        latest.Select(static t => t.TraceId)
            .Should()
            .BeEquivalentTo(["trace-whitespace-task", "trace-empty-task-retry"]);
    }
}
