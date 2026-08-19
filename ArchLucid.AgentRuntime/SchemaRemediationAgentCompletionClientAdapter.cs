using ArchLucid.AgentRuntime.AgentModelAliases;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;

namespace ArchLucid.AgentRuntime;

/// <summary>Adapts a plain <see cref="IAgentCompletionClient" /> to <see cref="ISchemaRemediationAgentCompletionClient" />.</summary>
public sealed class SchemaRemediationAgentCompletionClientAdapter(
    IAgentCompletionClient inner,
    IAgentModelAliasResolver? aliasResolver = null) : ISchemaRemediationAgentCompletionClient
{
    private readonly IAgentCompletionClient _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly IAgentModelAliasResolver? _aliasResolver = aliasResolver;

    /// <inheritdoc />
    public LlmProviderDescriptor Descriptor => _inner.Descriptor;

    /// <inheritdoc />
    public Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default)
    {
        AgentModelAliasRouterBinding.BindAlias(
            _aliasResolver,
            LlmModelTier.Economy,
            AgentModelTaskTypes.SchemaRemediation);

        return _inner.CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken);
    }
}
