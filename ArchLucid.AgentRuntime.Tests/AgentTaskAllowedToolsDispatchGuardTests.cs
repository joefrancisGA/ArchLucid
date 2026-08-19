using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "AgentRuntime")]
public sealed class AgentTaskAllowedToolsDispatchGuardTests
{
    [Fact]
    public void EnsureHandlerAllowed_empty_allowlist_on_non_production_like_permits_dispatch()
    {
        AgentTask task = new()
        {
            TaskId = "t1",
            AgentType = AgentType.Topology,
            AllowedTools = [],
        };

        Action act = () => AgentTaskAllowedToolsDispatchGuard.EnsureHandlerAllowed(
            task,
            AgentTypeKeys.Topology,
            productionLikeHosting: false);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureHandlerAllowed_empty_allowlist_on_production_like_denies_dispatch()
    {
        AgentTask task = new()
        {
            TaskId = "t1",
            AgentType = AgentType.Topology,
            AllowedTools = [],
        };

        Action act = () => AgentTaskAllowedToolsDispatchGuard.EnsureHandlerAllowed(
            task,
            AgentTypeKeys.Topology,
            productionLikeHosting: true);

        act.Should().Throw<AgentToolNotAllowedException>();
    }

    [Fact]
    public void EnsureHandlerAllowed_unrestricted_sentinel_on_production_like_permits_dispatch()
    {
        AgentTask task = new()
        {
            TaskId = "t1",
            AgentType = AgentType.Topology,
            AllowedTools = [AgentTypeKeys.UnrestrictedDispatch],
        };

        Action act = () => AgentTaskAllowedToolsDispatchGuard.EnsureHandlerAllowed(
            task,
            AgentTypeKeys.Topology,
            productionLikeHosting: true);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureHandlerAllowed_listed_key_permits_dispatch()
    {
        AgentTask task = new()
        {
            TaskId = "t1",
            AgentType = AgentType.Compliance,
            AllowedTools = [AgentTypeKeys.Compliance, AgentTypeKeys.Topology],
        };

        Action act = () => AgentTaskAllowedToolsDispatchGuard.EnsureHandlerAllowed(
            task,
            AgentTypeKeys.Compliance,
            productionLikeHosting: true);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureHandlerAllowed_missing_key_throws()
    {
        AgentTask task = new()
        {
            TaskId = "t1",
            AgentType = AgentType.Topology,
            AllowedTools = [AgentTypeKeys.Compliance],
        };

        Action act = () => AgentTaskAllowedToolsDispatchGuard.EnsureHandlerAllowed(
            task,
            AgentTypeKeys.Topology,
            productionLikeHosting: false);

        act.Should().Throw<AgentToolNotAllowedException>();
    }
}
