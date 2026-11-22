using ArchLucid.AgentRuntime.AgentModelAliases;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Agents;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class CatalogBackedAgentModelAliasRegistryBootstrapTests
{
    [Fact]
    public async Task Concurrent_seed_invalidation_does_not_deadlock_readers()
    {
        AgentModelTierResolver resolver = AgentModelTierResolverTestsHelper.CreateResolver(
            new Dictionary<string, string?> { ["AzureOpenAI:DeploymentName"] = "primary-deploy" },
            new AgentModelTierOptions());

        YieldingCatalogRepository repository = new();
        ServiceCollection services = new();
        services.AddSingleton<IAgentModelCatalogRepository>(repository);

        using ServiceProvider provider = services.BuildServiceProvider();
        CatalogBackedAgentModelAliasRegistry registry =
            new(provider.GetRequiredService<IServiceScopeFactory>(), resolver);

        Task<IReadOnlyCollection<AgentModelAliasRegistryEntry>>[] readers = Enumerable.Range(0, 4)
            .Select(_ => Task.Run(() => registry.ListEntries()))
            .ToArray();

        IReadOnlyCollection<AgentModelAliasRegistryEntry>[] snapshots =
            await Task.WhenAll(readers).WaitAsync(TimeSpan.FromSeconds(10));

        snapshots.Should().OnlyContain(snapshot => snapshot.Count == 3);
        repository.UpsertCount.Should().Be(3);

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
}
