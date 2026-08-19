using System.Text;

using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatch6Tests
{
    [Fact]
    public void AgentUserPromptStaticPrefix_emits_topology_azure_guidance()
    {
        StringBuilder sb = new();
        AgentUserPromptStaticPrefix.AppendTopology(sb, CloudProvider.Azure);

        string prompt = sb.ToString();
        prompt.Should().Contain("topology AgentResult");
        prompt.Should().Contain("App Service");
    }

    [Fact]
    public void AgentUserPromptStaticPrefix_emits_compliance_cost_and_critic_sections()
    {
        StringBuilder compliance = new();
        StringBuilder cost = new();
        StringBuilder critic = new();
        AgentUserPromptStaticPrefix.AppendCompliance(compliance, CloudProvider.Azure);
        AgentUserPromptStaticPrefix.AppendCost(cost, CloudProvider.Azure);
        AgentUserPromptStaticPrefix.AppendCritic(critic, CloudProvider.Azure);

        compliance.ToString().Should().Contain("compliance AgentResult");
        cost.ToString().Should().Contain("cost AgentResult");
        critic.ToString().Should().Contain("critic AgentResult");
    }

    [Fact]
    public void PassThroughAgentTierCompletionRouter_returns_inner_client_and_resolved_tier()
    {
        Mock<IAgentCompletionClient> inner = new();
        Mock<IAgentModelTierResolver> resolver = new();
        resolver
            .Setup(r => r.ResolveTierForAgentTypeName(AgentType.Topology.ToString(), null))
            .Returns(LlmModelTier.Standard);
        PassThroughAgentTierCompletionRouter sut = new(inner.Object, resolver.Object);

        (IAgentCompletionClient client, LlmModelTier tier) = sut.ResolveForAgent(AgentType.Topology, null);

        client.Should().BeSameAs(inner.Object);
        tier.Should().Be(LlmModelTier.Standard);
        sut.DefaultCompletionClient.Should().BeSameAs(inner.Object);
    }

    [Fact]
    public void PassThroughAgentTierCompletionRouter_rejects_null_dependencies()
    {
        Mock<IAgentCompletionClient> inner = new();

        Action missingResolver = () => _ = new PassThroughAgentTierCompletionRouter(inner.Object, null!);
        Action missingInner = () => _ = new PassThroughAgentTierCompletionRouter(null!, Mock.Of<IAgentModelTierResolver>());

        missingResolver.Should().Throw<ArgumentNullException>();
        missingInner.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void FindingConfidenceHarnessExtensions_maps_harness_result_to_calculator()
    {
        FindingConfidenceCalculator calculator = new();
        AgentOutputHarnessResult harness = new() { Passed = true };

        FindingConfidenceCalculationResult result =
            calculator.CalculateFromHarness(harness, traceCompletenessRatio: 0.75m, referenceCaseMatched: true);

        result.Score.Should().BeGreaterThan(0);
    }

    [Fact]
    public void PolicyPackExplainLlmPrompts_exposes_simulator_routing_marker()
    {
        PolicyPackExplainLlmPrompts.SimulatorRoutingMarker.Should().Contain("POLICY_PACK");
    }
}
