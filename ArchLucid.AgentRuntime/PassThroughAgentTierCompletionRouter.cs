using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Uses one <see cref="IAgentCompletionClient" /> for all tiers (simulator, echo, fake) while still resolving tier for
///     lineage.
/// </summary>
public sealed class PassThroughAgentTierCompletionRouter(
    IAgentCompletionClient inner,
    IAgentModelTierResolver resolver) : IAgentTierCompletionRouter
{
    private readonly IAgentCompletionClient _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly IAgentModelTierResolver _resolver =
        resolver ?? throw new ArgumentNullException(nameof(resolver));

    /// <inheritdoc />
    public (IAgentCompletionClient Client, LlmModelTier ResolvedTier) ResolveForAgent(
        AgentType agentType,
        LlmModelTier? taskTierOverride)
    {
        LlmModelTier tier = _resolver.ResolveTierForAgent(agentType, taskTierOverride);

        return (_inner, tier);
    }

    /// <inheritdoc />
    public IAgentCompletionClient DefaultCompletionClient => _inner;
}
