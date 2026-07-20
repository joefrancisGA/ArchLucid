using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatch8Tests
{
    [Fact]
    public void StreamingJsonAnswerExtractor_emits_deltas_handles_escapes_and_reset()
    {
        StreamingJsonAnswerExtractor sut = new();

        sut.AppendChunkAndTakeAnswerDelta(string.Empty).Should().BeEmpty();
        sut.AppendChunkAndTakeAnswerDelta("{\"ans").Should().BeEmpty();
        sut.AppendChunkAndTakeAnswerDelta("wer\":\"Hel").Should().Be("Hel");
        sut.AppendChunkAndTakeAnswerDelta("lo\\nWorld\"").Should().Be("lo\nWorld");
        sut.RawJson.Should().Contain("answer");

        sut.Reset();
        sut.RawJson.Should().BeEmpty();
        sut.AppendChunkAndTakeAnswerDelta("{\"answer\":\"again\"}").Should().Be("again");
    }

    [Fact]
    public void AgentModelTierResolver_resolves_override_map_defaults_and_deployments()
    {
        Dictionary<string, string?> configValues = new()
        {
            ["AgentExecution:Mode"] = "Simulator",
            ["AzureOpenAI:DeploymentName"] = "gpt-base",
            ["Llm:Deployments:Reasoning"] = "gpt-reason",
            ["Llm:Deployments:Fast"] = "gpt-fast",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(configValues!).Build();

        Mock<IOptionsMonitor<AgentModelTierOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(
            new AgentModelTierOptions
            {
                DefaultTier = "Premium",
                NonAgentDefaultTier = "Economy",
                AgentTypeTiers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    [AgentType.Topology.ToString()] = "Standard",
                },
                StandardDeploymentName = "std-deploy",
                PremiumDeploymentName = "prem-deploy",
                EconomyDeploymentName = "eco-deploy",
            });

        AgentModelTierResolver sut = new(configuration, options.Object);

        sut.ResolveTierForAgent(AgentType.Topology, LlmModelTier.Economy).Should().Be(LlmModelTier.Economy);
        sut.ResolveTierForAgentTypeName(AgentType.Topology.ToString(), null).Should().Be(LlmModelTier.Standard);
        sut.ResolveTierForAgentTypeName(AgentType.Cost.ToString(), null).Should().Be(LlmModelTier.Premium);
        sut.ResolveDefaultTenantTier().Should().Be(LlmModelTier.Premium);
        sut.ResolveNonAgentDefaultTier().Should().Be(LlmModelTier.Economy);
        sut.ResolveDeploymentName(LlmModelTier.Standard).Should().Be("std-deploy");
        sut.ResolveDeploymentName(LlmModelTier.Premium).Should().Be("prem-deploy");
        sut.ResolveDeploymentName(LlmModelTier.Economy).Should().Be("eco-deploy");
    }

    [Fact]
    public void AgentModelTierResolver_falls_back_to_simulator_deployment_when_non_azure_stack()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["AgentExecution:CompletionClient"] = "Echo",
                }!)
            .Build();

        Mock<IOptionsMonitor<AgentModelTierOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new AgentModelTierOptions());

        AgentModelTierResolver sut = new(configuration, options.Object);

        sut.ResolveDeploymentName(LlmModelTier.Standard)
            .Should()
            .Be(AgentExecutionTraceModelMetadata.SimulatorDeploymentName);
    }
}
