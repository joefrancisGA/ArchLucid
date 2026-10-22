namespace ArchLucid.AgentRuntime;

/// <summary>
///     Optional streaming surface for <see cref="IAgentCompletionClient" /> — yields assistant JSON text as it is
///     generated.
/// </summary>
public interface IAgentStreamingCompletionClient : IAgentCompletionClient
{
    /// <summary>
    ///     Streams assistant message text chunks in generation order (typically JSON for Ask and agent handlers).
    /// </summary>
    IAsyncEnumerable<string> StreamJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default);
}
