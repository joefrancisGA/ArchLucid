namespace ArchLucid.Core.Llm;

/// <summary>
///     Minimal JSON-oriented completion abstraction for lower layers that cannot reference runtime implementations.
/// </summary>
public interface IAgentCompletionClient
{
    Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default);
}
