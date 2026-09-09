using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentExecutionTraceInsertParametersTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void AttemptKey_normalizes_outer_whitespace_on_task_id()
    {
        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-1",
            RunId = Guid.NewGuid().ToString("N"),
            TaskId = " task-1 ",
            AgentType = AgentType.Topology,
            AttemptIndex = 2,
            CreatedUtc = DateTime.UtcNow,
        };

        object attemptKey = AgentExecutionTraceInsertParameters.AttemptKey(trace);

        attemptKey.GetType().GetProperty("TaskId")!.GetValue(attemptKey).Should().Be("task-1");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Create_normalizes_outer_whitespace_on_task_id()
    {
        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-1",
            RunId = Guid.NewGuid().ToString("N"),
            TaskId = " task-1 ",
            AgentType = AgentType.Topology,
            AttemptIndex = 2,
            CreatedUtc = DateTime.UtcNow,
        };

        object insertParams = AgentExecutionTraceInsertParameters.Create(trace, "{}");

        insertParams.GetType().GetProperty("TaskId")!.GetValue(insertParams).Should().Be("task-1");
    }
}
