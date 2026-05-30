using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "AgentRuntime")]
public sealed class AgentTaskAllowedToolsDispatchGuardTests
{
    [Fact]
    public void EnsureHandlerAllowed_empty_allowlist_permits_dispatch()
    {
        AgentTask task = new()
        {
            TaskId = "t1",
            AgentType = AgentType.Topology,
            AllowedTools = [],
        };

        Action act = () => AgentTaskAllowedToolsDispatchGuard.EnsureHandlerAllowed(task, "Topology");

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureHandlerAllowed_listed_key_permits_dispatch()
    {
        AgentTask task = new()
        {
            TaskId = "t1",
            AgentType = AgentType.Compliance,
            AllowedTools = ["Compliance", "Topology"],
        };

        Action act = () => AgentTaskAllowedToolsDispatchGuard.EnsureHandlerAllowed(task, "Compliance");

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureHandlerAllowed_missing_key_throws()
    {
        AgentTask task = new()
        {
            TaskId = "t1",
            AgentType = AgentType.Topology,
            AllowedTools = ["Compliance"],
        };

        Action act = () => AgentTaskAllowedToolsDispatchGuard.EnsureHandlerAllowed(task, "Topology");

        act.Should().Throw<AgentToolNotAllowedException>();
    }
}
