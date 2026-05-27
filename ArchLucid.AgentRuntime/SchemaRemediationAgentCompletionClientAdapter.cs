namespace ArchLucid.AgentRuntime;

/// <summary>Adapts a plain <see cref="IAgentCompletionClient" /> to <see cref="ISchemaRemediationAgentCompletionClient" />.</summary>
public sealed class SchemaRemediationAgentCompletionClientAdapter(IAgentCompletionClient inner)
    : ISchemaRemediationAgentCompletionClient
{
    private readonly IAgentCompletionClient _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public LlmProviderDescriptor Descriptor => _inner.Descriptor;

    /// <inheritdoc />
    public Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default) =>
        _inner.CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken);
}
