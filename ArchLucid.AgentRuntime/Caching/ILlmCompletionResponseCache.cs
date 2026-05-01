namespace ArchLucid.AgentRuntime.Caching;

/// <summary>
///     In-process completion response cache (backed by
///     <see cref="Microsoft.Extensions.Caching.Memory.IMemoryCache" />).
/// </summary>
public interface ILlmCompletionResponseCache
{
    Task<LlmCompletionResult?> TryGetAsync(LlmCompletionCacheKey key, CancellationToken cancellationToken);

    Task SetAsync(LlmCompletionCacheKey key, LlmCompletionResult result, CancellationToken cancellationToken);
}
