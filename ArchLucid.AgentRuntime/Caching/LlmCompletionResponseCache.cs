namespace ArchLucid.AgentRuntime.Caching;

/// <summary>Completion response cache built on <see cref="ISemanticCache" /> (composite keys including SHA-256 prompt fingerprints).</summary>
public sealed class LlmCompletionResponseCache : ILlmCompletionResponseCache
{
    private readonly ISemanticCache _semanticCache;

    /// <summary>Creates the cache.</summary>
    public LlmCompletionResponseCache(ISemanticCache semanticCache)
    {
        ArgumentNullException.ThrowIfNull(semanticCache);

        _semanticCache = semanticCache;
    }

    /// <inheritdoc />
    public async Task<LlmCompletionResult?> TryGetAsync(LlmCompletionCacheKey key, CancellationToken cancellationToken)
    {
        string memoryKey = ToMemoryKey(key);
        string? body = await _semanticCache.GetCachedResponseAsync(memoryKey, cancellationToken);

        if (body is null)
            return null;

        return new LlmCompletionResult(body);
    }

    /// <inheritdoc />
    public Task SetAsync(LlmCompletionCacheKey key, LlmCompletionResult result, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(result);

        string memoryKey = ToMemoryKey(key);

        return _semanticCache.SetCachedResponseAsync(memoryKey, result.JsonBody, cancellationToken);
    }

    internal static TimeSpan ResolveTtl(LlmCompletionCacheOptions options)
    {
        if (options is null)
            throw new ArgumentNullException(nameof(options));

        int ttlSeconds = options.TTLSeconds > 0
            ? options.TTLSeconds
            : checked(options.TTLMinutes * 60);

        if (ttlSeconds < 1)
            ttlSeconds = 1;

        return TimeSpan.FromSeconds(ttlSeconds);
    }

    internal static string ToMemoryKey(LlmCompletionCacheKey key)
    {
        if (string.IsNullOrWhiteSpace(key.AgentType))
            throw new ArgumentException("AgentType is required.", nameof(key));

        if (string.IsNullOrWhiteSpace(key.ModelName))
            throw new ArgumentException("ModelName is required.", nameof(key));

        if (string.IsNullOrWhiteSpace(key.PromptHashHex))
            throw new ArgumentException("PromptHashHex is required.", nameof(key));

        return "al:llmcomp:v1:"
               + key.AgentType
               + ':'
               + key.ModelName
               + ':'
               + (key.Simulator ? '1' : '0')
               + ':'
               + key.ScopePartition
               + ':'
               + key.PromptHashHex;
    }
}
