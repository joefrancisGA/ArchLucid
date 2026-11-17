using ArchLucid.AgentRuntime.AgentModelAliases;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Agents;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class AgentModelAliasRegistryTests
{
    [Fact]
    public void Catalog_registry_seeds_three_aliases_from_tier_deployments()
    {
        AgentModelTierResolver tierResolver = AgentModelTierResolverTestsHelper.CreateResolver(
            new Dictionary<string, string?>
            {
                ["AzureOpenAI:DeploymentName"] = "primary-deploy",
                ["Llm:Deployments:Fast"] = "gpt-4o-mini",
                ["Llm:Deployments:Reasoning"] = "gpt-4o",
            },
            new AgentModelTierOptions());

        CatalogBackedAgentModelAliasRegistry registry =
            AgentModelAliasRegistryTestsHelper.CreateCatalogRegistry(tierResolver);

        registry.ListEntries().Should().HaveCount(3);
        registry.GetRequired(AgentModelAliasIds.EconomyGeneral).DeploymentName.Should().Be("gpt-4o-mini");
        registry.GetRequired(AgentModelAliasIds.StandardGeneral).DeploymentName.Should().Be("primary-deploy");
        registry.GetRequired(AgentModelAliasIds.PremiumAssurance).DeploymentName.Should().Be("gpt-4o");
    }

    [Fact]
    public async Task Catalog_registry_async_first_seed_invalidates_without_deadlock_under_concurrent_readers()
    {
        AgentModelTierResolver tierResolver = AgentModelTierResolverTestsHelper.CreateResolver(
            new Dictionary<string, string?> { ["AzureOpenAI:DeploymentName"] = "primary-deploy" },
            new AgentModelTierOptions());
        YieldingCatalogRepository catalogRepository = new();
        ServiceCollection services = new();
        services.AddSingleton<IAgentModelCatalogRepository>(catalogRepository);
        using ServiceProvider provider = services.BuildServiceProvider();
        CatalogBackedAgentModelAliasRegistry registry =
            new(provider.GetRequiredService<IServiceScopeFactory>(), tierResolver);

        Task<IReadOnlyCollection<AgentModelAliasRegistryEntry>>[] readers = Enumerable.Range(0, 4)
            .Select(_ => Task.Run(() => registry.ListEntries()))
            .ToArray();

        // Previously the seed's asynchronous Invalidate blocked behind GetSnapshot's cache lock.
        IReadOnlyCollection<AgentModelAliasRegistryEntry>[] snapshots =
            await Task.WhenAll(readers).WaitAsync(TimeSpan.FromSeconds(10));

        snapshots.Should().OnlyContain(snapshot => snapshot.Count == 3);
        catalogRepository.UpsertCount.Should().Be(3);

        registry.Invalidate();
        registry.ListEntries().Should().HaveCount(3);
    }

    private sealed class YieldingCatalogRepository : IAgentModelCatalogRepository
    {
        private readonly InMemoryAgentModelCatalogRepository _inner = new();
        private int _upserts;

        public int UpsertCount => Volatile.Read(ref _upserts);

        public async Task<int> CountAsync(CancellationToken cancellationToken)
        {
            await Task.Yield();
            return await _inner.CountAsync(cancellationToken);
        }

        public Task<IReadOnlyList<AgentModelCatalogRow>> ListAllAsync(CancellationToken cancellationToken) =>
            _inner.ListAllAsync(cancellationToken);

        public Task<AgentModelCatalogRow?> TryGetAsync(string aliasId, CancellationToken cancellationToken) =>
            _inner.TryGetAsync(aliasId, cancellationToken);

        public async Task UpsertAsync(AgentModelCatalogRow row, CancellationToken cancellationToken)
        {
            await Task.Yield();
            await _inner.UpsertAsync(row, cancellationToken);
            Interlocked.Increment(ref _upserts);
        }
    }

    [Fact]
    public void ResolveAliasIdForTier_maps_economy_standard_and_premium()
    {
        AgentModelTierResolver tierResolver = AgentModelTierResolverTestsHelper.CreateResolver(
            new Dictionary<string, string?> { ["AzureOpenAI:DeploymentName"] = "primary-deploy" },
            new AgentModelTierOptions());

        CatalogBackedAgentModelAliasRegistry registry =
            AgentModelAliasRegistryTestsHelper.CreateCatalogRegistry(tierResolver);

        registry.ResolveAliasIdForTier(LlmModelTier.Economy).Should().Be(AgentModelAliasIds.EconomyGeneral);
        registry.ResolveAliasIdForTier(LlmModelTier.Standard).Should().Be(AgentModelAliasIds.StandardGeneral);
        registry.ResolveAliasIdForTier(LlmModelTier.Premium).Should().Be(AgentModelAliasIds.PremiumAssurance);
    }

    [Fact]
    public void Registry_seed_alias_ids_match_canonical_constants()
    {
        AgentModelTierResolver tierResolver = AgentModelTierResolverTestsHelper.CreateResolver(
            new Dictionary<string, string?> { ["AzureOpenAI:DeploymentName"] = "primary-deploy" },
            new AgentModelTierOptions());

        CatalogBackedAgentModelAliasRegistry registry =
            AgentModelAliasRegistryTestsHelper.CreateCatalogRegistry(tierResolver);

        registry.ListEntries()
            .Select(entry => entry.AliasId)
            .Should()
            .BeEquivalentTo(
            [
                AgentModelAliasIds.EconomyGeneral,
                AgentModelAliasIds.StandardGeneral,
                AgentModelAliasIds.PremiumAssurance
            ]);
    }

    [Fact]
    public void Catalog_registry_seeds_simulator_aliases_when_mode_is_simulator_without_azure_deployment()
    {
        AgentModelTierResolver tierResolver = AgentModelTierResolverTestsHelper.CreateResolver(
            new Dictionary<string, string?> { ["AgentExecution:Mode"] = "Simulator" },
            new AgentModelTierOptions());

        CatalogBackedAgentModelAliasRegistry registry =
            AgentModelAliasRegistryTestsHelper.CreateCatalogRegistry(tierResolver);

        registry.GetRequired(AgentModelAliasIds.EconomyGeneral).DeploymentName
            .Should()
            .Be(AgentExecutionTraceModelMetadata.SimulatorDeploymentName);
    }
}

internal static class AgentModelTierResolverTestsHelper
{
    internal static AgentModelTierResolver CreateResolver(
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
