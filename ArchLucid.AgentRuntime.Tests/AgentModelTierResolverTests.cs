using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.AgentModelAliases;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class AgentModelTierResolverTests
{
    [Fact]
    public void ResolveTierForAgent_uses_task_override_before_agent_mapping()
    {
        AgentModelTierResolver resolver = CreateResolver(
            new Dictionary<string, string?> { ["AzureOpenAI:DeploymentName"] = "primary-deploy" },
            new AgentModelTierOptions
            {
                AgentTypeTiers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["Topology"] = nameof(LlmModelTier.Premium)
                }
            });

        LlmModelTier tier = resolver.ResolveTierForAgent(AgentType.Topology, LlmModelTier.Economy);

        tier.Should().Be(LlmModelTier.Economy);
    }

    [Fact]
    public void ResolveTierForAgent_maps_starter_agents_to_luna_terra_sol_tiers_by_default()
    {
        AgentModelTierResolver resolver = CreateResolver(
            new Dictionary<string, string?> { ["AzureOpenAI:DeploymentName"] = "primary-deploy" },
            new AgentModelTierOptions());

        resolver.ResolveTierForAgent(AgentType.Topology, null).Should().Be(LlmModelTier.Economy);
        resolver.ResolveTierForAgent(AgentType.Cost, null).Should().Be(LlmModelTier.Economy);
        resolver.ResolveTierForAgent(AgentType.Compliance, null).Should().Be(LlmModelTier.Standard);
        resolver.ResolveTierForAgent(AgentType.Critic, null).Should().Be(LlmModelTier.Premium);
    }

    [Fact]
    public void ResolveDeploymentName_reads_llm_deployments_fast_and_reasoning_aliases()
    {
        AgentModelTierResolver resolver = CreateResolver(
            new Dictionary<string, string?>
            {
                ["AzureOpenAI:DeploymentName"] = "primary-deploy",
                ["Llm:Deployments:Fast"] = "gpt-4o-mini",
                ["Llm:Deployments:Reasoning"] = "gpt-4o",
            },
            new AgentModelTierOptions());

        resolver.ResolveDeploymentName(LlmModelTier.Economy).Should().Be("gpt-4o-mini");
        resolver.ResolveDeploymentName(LlmModelTier.Premium).Should().Be("gpt-4o");
    }

    [Fact]
    public void ResolveDeploymentName_falls_back_to_primary_when_tier_deployment_empty()
    {
        AgentModelTierResolver resolver = CreateResolver(
            new Dictionary<string, string?> { ["AzureOpenAI:DeploymentName"] = "primary-deploy" },
            new AgentModelTierOptions { PremiumDeploymentName = "premium-deploy" });

        resolver.ResolveDeploymentName(LlmModelTier.Standard).Should().Be("primary-deploy");
        resolver.ResolveDeploymentName(LlmModelTier.Premium).Should().Be("premium-deploy");
    }

    [Fact]
    public void ResolveNonAgentDefaultTier_defaults_to_standard()
    {
        AgentModelTierResolver resolver = CreateResolver(
            new Dictionary<string, string?> { ["AzureOpenAI:DeploymentName"] = "primary-deploy" },
            new AgentModelTierOptions());

        resolver.ResolveNonAgentDefaultTier().Should().Be(LlmModelTier.Standard);
    }

    [Fact]
    public void ResolveDeploymentName_uses_simulator_sentinel_when_mode_is_simulator_and_azure_deployment_missing()
    {
        AgentModelTierResolver resolver = CreateResolver(
            new Dictionary<string, string?> { ["AgentExecution:Mode"] = "Simulator" },
            new AgentModelTierOptions());

        resolver.ResolveDeploymentName(LlmModelTier.Economy)
            .Should()
            .Be(AgentExecutionTraceModelMetadata.SimulatorDeploymentName);
    }

    [Fact]
    public void ResolveDeploymentName_uses_simulator_sentinel_when_mode_is_real_echo_without_azure_deployment()
    {
        AgentModelTierResolver resolver = CreateResolver(
            new Dictionary<string, string?>
            {
                ["AgentExecution:Mode"] = "Real",
                ["AgentExecution:CompletionClient"] = "Echo",
            },
            new AgentModelTierOptions());

        resolver.ResolveDeploymentName(LlmModelTier.Standard)
            .Should()
            .Be(AgentExecutionTraceModelMetadata.SimulatorDeploymentName);
    }

    [Fact]
    public void ResolveDeploymentName_throws_when_mode_is_real_without_azure_deployment()
    {
        AgentModelTierResolver resolver = CreateResolver(
            new Dictionary<string, string?> { ["AgentExecution:Mode"] = "Real" },
            new AgentModelTierOptions());

        Action act = () => resolver.ResolveDeploymentName(LlmModelTier.Standard);

        act.Should().Throw<InvalidOperationException>().WithMessage("*AzureOpenAI:DeploymentName is missing*");
    }

    private static AgentModelTierResolver CreateResolver(
        IReadOnlyDictionary<string, string?> configValues,
        AgentModelTierOptions options)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues!)
            .Build();

        IOptionsMonitor<AgentModelTierOptions> optionsMonitor = new TestOptionsMonitor<AgentModelTierOptions>(options);

        AgentModelTierResolver resolver = new(configuration, optionsMonitor);
        AgentModelTierDefaults.ApplyDefaults(options);

        return resolver;
    }

    private sealed class TestOptionsMonitor<T>(T value) : IOptionsMonitor<T>
    {
        public T CurrentValue { get; private set; } = value;

        public T Get(string? name) => CurrentValue;

        public IDisposable OnChange(Action<T, string?> listener) => NullDisposable.Instance;

        private sealed class NullDisposable : IDisposable
        {
            public static NullDisposable Instance { get; } = new();

            public void Dispose()
            {
            }
        }
    }
}
