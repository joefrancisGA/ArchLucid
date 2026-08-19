using ArchLucid.Core.Agents;

namespace ArchLucid.AgentRuntime.Tokens;

/// <summary>Catalog-backed <see cref="ITokenCounter" /> resolution (TB-2107).</summary>
public sealed class CatalogTokenCounterResolver(IAgentModelAliasRegistry modelAliasRegistry) : ITokenCounterResolver
{
    private readonly IAgentModelAliasRegistry _modelAliasRegistry =
        modelAliasRegistry ?? throw new ArgumentNullException(nameof(modelAliasRegistry));

    private readonly ITokenCounter _defaultCounter = new CharHeuristicTokenCounter();

    public ITokenCounter Resolve(string? modelAliasId)
    {
        if (string.IsNullOrWhiteSpace(modelAliasId))
        {
            return _defaultCounter;
        }

        if (!_modelAliasRegistry.TryGet(modelAliasId, out AgentModelAliasRegistryEntry? entry) || entry is null)
        {
            return _defaultCounter;
        }

        return new ConfigurableCharHeuristicTokenCounter(entry.CharsPerToken);
    }
}
