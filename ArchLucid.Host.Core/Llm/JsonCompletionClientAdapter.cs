using ArchLucid.Core.Llm;

namespace ArchLucid.Host.Core.Llm;

/// <summary>
///     Adapts runtime completion client to the lower-layer completion abstraction.
/// </summary>
public sealed class JsonCompletionClientAdapter(
    ArchLucid.AgentRuntime.IAgentCompletionClient innerClient) : IAgentCompletionClient
{
    private readonly ArchLucid.AgentRuntime.IAgentCompletionClient _innerClient = innerClient ?? throw new ArgumentNullException(nameof(innerClient));

    public Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default)
    {
        return _innerClient.CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken);
    }
}
