using ArchLucid.AgentRuntime.AgentModelAliases;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Agents;

using IAgentModelTierResolver = ArchLucid.AgentRuntime.IAgentModelTierResolver;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.AgentRuntime.Tests;

internal static class AgentModelAliasRegistryTestsHelper
{
    internal static CatalogBackedAgentModelAliasRegistry CreateCatalogRegistry(AgentModelTierResolver tierResolver)
    {
        InMemoryAgentModelCatalogRepository repository = new();

        foreach (AgentModelCatalogRow row in AgentModelCatalogDefaultSeed.BuildDefaultRows())
        {
            repository.UpsertAsync(row, CancellationToken.None).GetAwaiter().GetResult();
        }

        ServiceCollection services = new();
        services.AddSingleton<IAgentModelCatalogRepository>(repository);
        ServiceProvider provider = services.BuildServiceProvider();
        ServiceScopeFactory scopeFactory = new(provider);

        CatalogBackedAgentModelAliasRegistry registry = new(scopeFactory, tierResolver);

        return registry;
    }

    private sealed class ServiceScopeFactory(IServiceProvider provider) : IServiceScopeFactory
    {
        public IServiceScope CreateScope() => new ServiceScope(provider);

        private sealed class ServiceScope(IServiceProvider provider) : IServiceScope
        {
            public IServiceProvider ServiceProvider { get; } = provider;

            public void Dispose()
            {
            }
        }
    }
}
