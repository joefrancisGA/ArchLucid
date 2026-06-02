using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Coordination;

/// <summary>TB-179: starter tasks assign economy/reasoning tiers per agent role.</summary>
[Trait("Suite", "Core")]
public sealed class RunStarterTaskFactoryTierTests
{
    [Fact]
    public void BuildStarterTasks_assigns_model_tier_overrides_for_quad_agent_run()
    {
        ArchitectureRequest request = new()
        {
            Description = "Design a secure multi-tier web application on Azure.",
            SystemName = "OrderService",
            Environment = "Production",
            RequiredCapabilities = ["web", "sql"],
            Constraints = ["private-networking"],
        };

        EvidenceBundle bundle = RunStarterTaskFactory.BuildEvidenceBundle(request);
        List<AgentTask> tasks = RunStarterTaskFactory.BuildStarterTasks("run-1", bundle, request);

        tasks.Should().HaveCount(4);
        tasks.Single(t => t.AgentType == AgentType.Topology).ModelTierOverride.Should().Be(LlmModelTier.Economy);
        tasks.Single(t => t.AgentType == AgentType.Cost).ModelTierOverride.Should().Be(LlmModelTier.Economy);
        tasks.Single(t => t.AgentType == AgentType.Compliance).ModelTierOverride.Should().Be(LlmModelTier.Premium);
        tasks.Single(t => t.AgentType == AgentType.Critic).ModelTierOverride.Should().Be(LlmModelTier.Premium);
    }
}
