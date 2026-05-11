namespace ArchLucid.AgentRuntime.Caching;

/// <summary>
///     In-process semantic cache for LLM completion text keyed by a fingerprint (typically SHA-256 hex of prompt
///     material, or a composite key from <see cref="LlmCompletionResponseCache" />).
/// </summary>
public interface ISemanticCache
{
    /// <summary>Returns the cached response when present; otherwise null.</summary>
    /// <param name="promptHash">Stable cache key (SHA-256 hex or composite completion cache key string).</param>
    Task<string?> GetCachedResponseAsync(string promptHash, CancellationToken cancellationToken = default);

    /// <summary>Persists a response for the given key with TTL from <c>AgentRuntime:CompletionCache</c>.</summary>
    Task SetCachedResponseAsync(string promptHash, string response, CancellationToken cancellationToken = default);
}
