using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Resolves an <see cref="IAgentCompletionClient" /> per <see cref="LlmModelTier" /> using a deployment-scoped factory.
/// </summary>
public sealed class TieredAgentCompletionRouter : IAgentTierCompletionRouter
{
    private readonly IAgentModelTierResolver _resolver;
    private readonly Func<LlmModelTier, IAgentCompletionClient> _clientFactory;
    private readonly Dictionary<LlmModelTier, IAgentCompletionClient> _clientsByTier = new();

    /// <summary>Creates a router that memoizes one client per tier within the current DI scope.</summary>
    public TieredAgentCompletionRouter(
        IAgentModelTierResolver resolver,
        Func<LlmModelTier, IAgentCompletionClient> clientFactory)
    {
        _resolver = resolver ?? throw new ArgumentNullException(nameof(resolver));
        _clientFactory = clientFactory ?? throw new ArgumentNullException(nameof(clientFactory));
    }

    /// <inheritdoc />
    public (IAgentCompletionClient Client, LlmModelTier ResolvedTier) ResolveForAgent(
        AgentType agentType,
        LlmModelTier? taskTierOverride)
    {
        LlmModelTier tier = _resolver.ResolveTierForAgent(agentType, taskTierOverride);
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
}
