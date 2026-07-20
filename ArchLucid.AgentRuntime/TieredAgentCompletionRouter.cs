using ArchLucid.AgentRuntime.AgentModelAliases;
using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Resolves an <see cref="IAgentCompletionClient" /> per <see cref="LlmModelTier" /> using a deployment-scoped factory.
/// </summary>
public sealed class TieredAgentCompletionRouter : IAgentTierCompletionRouter, IDisposable
{
    private readonly IAgentModelTierResolver _resolver;
    private readonly IAgentModelAliasResolver? _aliasResolver;
    private readonly Func<LlmModelTier, IAgentCompletionClient> _clientFactory;
    private readonly IAgentCompletionClient? _borrowedPrimaryClient;
    private readonly Dictionary<LlmModelTier, IAgentCompletionClient> _clientsByTier = new();

    /// <summary>Creates a router that memoizes one client per tier within the current DI scope.</summary>
    public TieredAgentCompletionRouter(
        IAgentModelTierResolver resolver,
        Func<LlmModelTier, IAgentCompletionClient> clientFactory,
        IAgentCompletionClient? borrowedPrimaryClient = null,
        IAgentModelAliasResolver? aliasResolver = null)
    {
        _resolver = resolver ?? throw new ArgumentNullException(nameof(resolver));
        _clientFactory = clientFactory ?? throw new ArgumentNullException(nameof(clientFactory));
        _borrowedPrimaryClient = borrowedPrimaryClient;
        _aliasResolver = aliasResolver;
    }

    /// <inheritdoc />
    public (IAgentCompletionClient Client, LlmModelTier ResolvedTier) ResolveForAgent(
        AgentType agentType,
        LlmModelTier? taskTierOverride)
    {
        return ResolveForAgentTypeName(agentType.ToString(), taskTierOverride);
    }

    /// <inheritdoc />
    public (IAgentCompletionClient Client, LlmModelTier ResolvedTier) ResolveForAgentTypeName(
        string agentTypeName,
        LlmModelTier? taskTierOverride)
    {
        LlmModelTier tier = _resolver.ResolveTierForAgentTypeName(agentTypeName, taskTierOverride);
        AgentModelAliasRouterBinding.BindAlias(_aliasResolver, tier, agentTypeName);
        IAgentCompletionClient client = ResolveClientForTier(tier);

        return (client, tier);
    }

    /// <inheritdoc />
    public IAgentCompletionClient DefaultCompletionClient =>
        ResolveClientForTier(_resolver.ResolveNonAgentDefaultTier());

    private IAgentCompletionClient ResolveClientForTier(LlmModelTier tier)
    {
        if (_clientsByTier.TryGetValue(tier, out IAgentCompletionClient? existing))
            return existing;

        IAgentCompletionClient created = _clientFactory(tier);
        _clientsByTier[tier] = created;

        return created;
    }

    /// <inheritdoc />
    public void Dispose()
    {
        foreach (IAgentCompletionClient client in _clientsByTier.Values)
        {
            if (_borrowedPrimaryClient is not null && ReferenceEquals(client, _borrowedPrimaryClient))
                continue;

            AgentCompletionClientLifecycle.DisposeIfDisposable(client);
        }
    }
}
