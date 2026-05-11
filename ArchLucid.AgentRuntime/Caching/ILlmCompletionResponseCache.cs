namespace ArchLucid.AgentRuntime.Caching;

/// <summary>
///     Typed completion cache over <see cref="ISemanticCache" /> (composite keys: agent, model, SHA-256 prompts,
///     simulator, optional scope).
/// </summary>
public interface ILlmCompletionResponseCache
{
    Task<LlmCompletionResult?> TryGetAsync(LlmCompletionCacheKey key, CancellationToken cancellationToken);

    Task SetAsync(LlmCompletionCacheKey key, LlmCompletionResult result, CancellationToken cancellationToken);
}
