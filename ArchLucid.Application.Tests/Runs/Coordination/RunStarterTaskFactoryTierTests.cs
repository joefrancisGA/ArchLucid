using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Agents;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Coordination;

/// <summary>TB-179 / TB-870: starter tasks assign model tiers per agent role and execution profile.</summary>
[Trait("Suite", "Core")]
public sealed class RunStarterTaskFactoryTierTests
{
    [Fact]
    public void BuildStarterTasks_assigns_model_tier_overrides_for_quad_agent_run()
    {
        ArchitectureRequest request = CreateRequest();
        EvidenceBundle bundle = RunStarterTaskFactory.BuildEvidenceBundle(request);
        List<AgentTask> tasks = RunStarterTaskFactory.BuildStarterTasks("run-1", bundle, request, []);

        tasks.Should().HaveCount(4);
        tasks.Single(t => t.AgentType == AgentType.Topology).ModelTierOverride.Should().Be(LlmModelTier.Economy);
        tasks.Single(t => t.AgentType == AgentType.Cost).ModelTierOverride.Should().Be(LlmModelTier.Economy);
        tasks.Single(t => t.AgentType == AgentType.Compliance).ModelTierOverride.Should().Be(LlmModelTier.Standard);
        tasks.Single(t => t.AgentType == AgentType.Critic).ModelTierOverride.Should().Be(LlmModelTier.Premium);
    }

    [Fact]
    public void BuildStarterTasks_economy_profile_assigns_economy_tiers_to_all_agents()
    {
        ArchitectureRequest request = CreateRequest();
        EvidenceBundle bundle = RunStarterTaskFactory.BuildEvidenceBundle(request);

        List<AgentTask> tasks = RunStarterTaskFactory.BuildStarterTasks(
            "run-1",
            bundle,
            request,
            [],
            AgentModelExecutionProfile.Economy);

        tasks.Should().OnlyContain(task => task.ModelTierOverride == LlmModelTier.Economy);
    }

    [Fact]
    public void BuildStarterTasks_high_assurance_profile_assigns_premium_tiers_to_all_agents()
    {
        ArchitectureRequest request = CreateRequest();
        EvidenceBundle bundle = RunStarterTaskFactory.BuildEvidenceBundle(request);

        List<AgentTask> tasks = RunStarterTaskFactory.BuildStarterTasks(
            "run-1",
            bundle,
            request,
            [],
            AgentModelExecutionProfile.HighAssurance);

        tasks.Should().OnlyContain(task => task.ModelTierOverride == LlmModelTier.Premium);
    }

    [Fact]
    public void BuildStarterTasks_profile_only_changes_model_tier_override()
    {
        ArchitectureRequest request = CreateRequest();
        EvidenceBundle bundle = RunStarterTaskFactory.BuildEvidenceBundle(request);

        List<AgentTask> economyTasks = RunStarterTaskFactory.BuildStarterTasks(
            "run-1",
            bundle,
            request,
            [],
            AgentModelExecutionProfile.Economy);

        List<AgentTask> highAssuranceTasks = RunStarterTaskFactory.BuildStarterTasks(
            "run-1",
            bundle,
            request,
            [],
            AgentModelExecutionProfile.HighAssurance);

        economyTasks.Should().HaveCount(highAssuranceTasks.Count);

        for (int index = 0; index < economyTasks.Count; index++)
        {
            AgentTask economy = economyTasks[index];
            AgentTask highAssurance = highAssuranceTasks[index];

            economy.AgentType.Should().Be(highAssurance.AgentType);
            economy.Objective.Should().Be(highAssurance.Objective);
            economy.AllowedTools.Should().Equal(highAssurance.AllowedTools);
            economy.AllowedSources.Should().Equal(highAssurance.AllowedSources);
            economy.ModelTierOverride.Should().NotBe(highAssurance.ModelTierOverride);
        }
    }

    private static ArchitectureRequest CreateRequest() =>
        new()
        {
            Description = "Design a secure multi-tier web application on Azure.",
            SystemName = "OrderService",
            Environment = "Production",
            RequiredCapabilities = ["web", "sql"],
            Constraints = ["private-networking"],
        };
}
