using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentTypeKeysTests
{
    [Theory]
    [InlineData(AgentType.Topology, AgentTypeKeys.Topology)]
    [InlineData(AgentType.Cost, AgentTypeKeys.Cost)]
    [InlineData(AgentType.Compliance, AgentTypeKeys.Compliance)]
    [InlineData(AgentType.Critic, AgentTypeKeys.Critic)]
    public void FromEnum_maps_known_roles(AgentType agentType, string expectedKey)
    {
        AgentTypeKeys.FromEnum(agentType).Should().Be(expectedKey);
    }

    [Fact]
    public void FromEnum_throws_for_unknown_value()
    {
        const AgentType unknown = (AgentType)99;

        Action act = () => AgentTypeKeys.FromEnum(unknown);

        act.Should().Throw<ArgumentOutOfRangeException>().WithParameterName("agentType");
    }

    [Fact]
    public void ResolveDispatchKey_trims_explicit_key_when_present()
    {
        AgentTask task = new()
        {
            RunId = "r",
            AgentType = AgentType.Topology,
            AgentTypeKey = "  custom-handler  ",
            Objective = "o",
        };

        AgentTypeKeys.ResolveDispatchKey(task).Should().Be("custom-handler");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void ResolveDispatchKey_falls_back_to_enum_when_key_missing(string? agentTypeKey)
    {
        AgentTask task = new()
        {
            RunId = "r",
            AgentType = AgentType.Compliance,
            AgentTypeKey = agentTypeKey,
            Objective = "o",
        };

        AgentTypeKeys.ResolveDispatchKey(task).Should().Be(AgentTypeKeys.Compliance);
    }

    [Fact]
    public void ResolveDispatchKey_throws_when_task_null()
    {
        Action act = () => AgentTypeKeys.ResolveDispatchKey(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("task");
    }

    [Fact]
    public void TryMapToEnum_returns_null_for_null_key()
    {
        AgentTypeKeys.TryMapToEnum(null!).Should().BeNull();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void TryMapToEnum_returns_null_for_blank(string key)
    {
        AgentTypeKeys.TryMapToEnum(key).Should().BeNull();
    }

    [Theory]
    [InlineData("topology", AgentType.Topology)]
    [InlineData("TOPOLOGY", AgentType.Topology)]
    [InlineData("cost", AgentType.Cost)]
    [InlineData("Compliance", AgentType.Compliance)]
    [InlineData(" critic ", AgentType.Critic)]
    public void TryMapToEnum_maps_builtin_keys_case_insensitive(string key, AgentType expected)
    {
        AgentTypeKeys.TryMapToEnum(key).Should().Be(expected);
    }

    [Fact]
    public void TryMapToEnum_returns_null_for_unknown_key()
    {
        AgentTypeKeys.TryMapToEnum("custom-risk").Should().BeNull();
    }

    [Fact]
    public void CompareDispatchKeys_orders_lexicographically_case_insensitive()
    {
        AgentTypeKeys.CompareDispatchKeys("beta", "Alpha").Should().BeGreaterThan(0);
        AgentTypeKeys.CompareDispatchKeys("same", "SAME").Should().Be(0);
        AgentTypeKeys.CompareDispatchKeys("a", "b").Should().BeLessThan(0);
    }
}
