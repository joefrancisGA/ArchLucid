using ArchLucid.AgentRuntime.AgentModelAliases;
using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Uses one <see cref="IAgentCompletionClient" /> for all tiers (simulator, echo, fake) while still resolving tier for
///     lineage.
/// </summary>
public sealed class PassThroughAgentTierCompletionRouter(
    IAgentCompletionClient inner,
    IAgentModelTierResolver resolver,
    IAgentModelAliasResolver? aliasResolver = null) : IAgentTierCompletionRouter
{
    private readonly IAgentCompletionClient _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly IAgentModelTierResolver _resolver =
        resolver ?? throw new ArgumentNullException(nameof(resolver));

    private readonly IAgentModelAliasResolver? _aliasResolver = aliasResolver;

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

        return (_inner, tier);
    }

    /// <inheritdoc />
    public IAgentCompletionClient DefaultCompletionClient => _inner;
}
