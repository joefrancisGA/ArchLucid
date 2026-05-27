using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class AgentProvenanceCorrelationIdTests
{
    [Fact]
    public void Format_builds_stable_run_task_agent_key()
    {
        string key = AgentProvenanceCorrelationId.Format(
            "run-a",
            "task-b",
            AgentType.Compliance);

        key.Should().Be("run-a:task-b:Compliance");
    }
}
