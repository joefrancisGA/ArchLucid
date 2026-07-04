using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentExecuteIdempotentResultIndexTests
{
    [Fact]
    public void BuildLatestByTaskId_returns_last_row_per_task_id()
    {
        AgentResult first = new() { TaskId = "task-1", RunId = "run-1", AgentType = AgentType.Topology, Claims = ["first"] };
        AgentResult second = new() { TaskId = "task-1", RunId = "run-1", AgentType = AgentType.Topology, Claims = ["second"] };
        AgentResult other = new() { TaskId = "task-2", RunId = "run-1", AgentType = AgentType.Cost, Claims = ["other"] };

        IReadOnlyDictionary<string, AgentResult> index =
            AgentExecuteIdempotentResultIndex.BuildLatestByTaskId([first, second, other]);

        index.Should().HaveCount(2);
        index["task-1"].Claims.Should().Contain("second");
        index["task-2"].Claims.Should().Contain("other");
    }
}
