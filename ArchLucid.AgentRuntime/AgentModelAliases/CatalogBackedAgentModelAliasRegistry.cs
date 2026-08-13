using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Persistence.Ports;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.AgentRuntime.AgentModelAliases;

/// <summary>DDL-backed <see cref="IAgentModelAliasRegistry" /> with read-through cache (TB-2103).</summary>
public sealed class CatalogBackedAgentModelAliasRegistry(
    IServiceScopeFactory scopeFactory,
    IAgentModelTierResolver tierResolver) : IAgentModelAliasRegistry, IAgentModelCatalogCacheInvalidator
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IAgentModelTierResolver _tierResolver =
        tierResolver ?? throw new ArgumentNullException(nameof(tierResolver));

    private readonly object _cacheGate = new();
    private IReadOnlyDictionary<string, AgentModelAliasRegistryEntry>? _cachedEntries;

    public void Invalidate()
    {
        lock (_cacheGate)
        {
            _cachedEntries = null;
        }
    }

    public IReadOnlyCollection<AgentModelAliasRegistryEntry> ListEntries()
    {
        return GetSnapshot().Values.ToList();
    }

    public AgentModelAliasRegistryEntry GetRequired(string aliasId)
    {
        if (TryGet(aliasId, out AgentModelAliasRegistryEntry? entry) && entry is not null)
        {
            return entry;
        }

        throw new KeyNotFoundException($"Model alias '{aliasId}' is not registered.");
    }

    public bool TryGet(string aliasId, out AgentModelAliasRegistryEntry? entry)
    {
        entry = null;

        if (string.IsNullOrWhiteSpace(aliasId))
        {
            return false;
        }

        return GetSnapshot().TryGetValue(aliasId.Trim(), out entry);
    }

    public string ResolveAliasIdForTier(LlmModelTier tier)
    {
        return tier switch
        {
            LlmModelTier.Economy => AgentModelAliasIds.EconomyGeneral,
            LlmModelTier.Premium => AgentModelAliasIds.PremiumAssurance,
            _ => AgentModelAliasIds.StandardGeneral
        };
    }

    private IReadOnlyDictionary<string, AgentModelAliasRegistryEntry> GetSnapshot()
    {
        lock (_cacheGate)
        {
            if (_cachedEntries is not null)
            {
                return _cachedEntries;
            }

            using IServiceScope scope = _scopeFactory.CreateScope();
            IAgentModelCatalogRepository catalogRepository =
                scope.ServiceProvider.GetRequiredService<IAgentModelCatalogRepository>();

            AgentModelCatalogBootstrapper bootstrapper = new(catalogRepository, this);
            bootstrapper.EnsureSeededAsync(CancellationToken.None).GetAwaiter().GetResult();

            IReadOnlyList<AgentModelCatalogRow> rows =
                catalogRepository.ListAllAsync(CancellationToken.None).GetAwaiter().GetResult();

            Dictionary<string, AgentModelAliasRegistryEntry> map = new(StringComparer.OrdinalIgnoreCase);

            foreach (AgentModelCatalogRow row in rows)
            {
                if (row.LifecycleStatus is AgentModelCatalogLifecycleStatus.Retired)
                {
                    continue;
                }

                map[row.AliasId] = MapRow(row);
            }

            _cachedEntries = map;

            return _cachedEntries;
        }
    }

    private AgentModelAliasRegistryEntry MapRow(AgentModelCatalogRow row)
    {
        string deploymentName = ResolveDeploymentName(row);

        return new AgentModelAliasRegistryEntry
        {
            AliasId = row.AliasId,
            ProviderConnectionKind = row.ProviderConnectionKind,
            DeploymentName = deploymentName,
            CapabilityTags = row.CapabilityTags,
            ApprovedTaskTypes = row.ApprovedTaskTypes,
            DataBoundary = row.DataBoundary,
            StructuredOutputLevel = row.StructuredOutputLevel,
            TaskEvaluations = row.Evaluations
        };
    }

    private string ResolveDeploymentName(AgentModelCatalogRow row)
    {
        if (!string.IsNullOrWhiteSpace(row.DeploymentName))
        {
            return row.DeploymentName;
        }

        if (!string.IsNullOrWhiteSpace(row.TierBinding)
            && Enum.TryParse(row.TierBinding, true, out LlmModelTier tier))
        {
            return _tierResolver.ResolveDeploymentName(tier);
        }

        return _tierResolver.ResolveDeploymentName(LlmModelTier.Standard);
    }
}
