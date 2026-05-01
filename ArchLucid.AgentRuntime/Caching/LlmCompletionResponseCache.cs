using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Caching;

/// <summary>Dedicated bounded <see cref="MemoryCache" /> for LLM completion bodies.</summary>
public sealed class LlmCompletionResponseCache : ILlmCompletionResponseCache, IDisposable
{
    private readonly MemoryCache _cache;
    private readonly IOptionsMonitor<LlmCompletionCacheOptions> _optionsMonitor;

    /// <summary>Creates the cache backed by <paramref name="cache" /> (caller owns dispose unless this instance disposes it).</summary>
    public LlmCompletionResponseCache(MemoryCache cache, IOptionsMonitor<LlmCompletionCacheOptions> optionsMonitor)
    {
        ArgumentNullException.ThrowIfNull(cache);
        ArgumentNullException.ThrowIfNull(optionsMonitor);

        _cache = cache;
        _optionsMonitor = optionsMonitor;
    }

    /// <inheritdoc />
    public void Dispose()
    {
        _cache.Dispose();
    }

    /// <inheritdoc />
    public Task<LlmCompletionResult?> TryGetAsync(LlmCompletionCacheKey key, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        string memoryKey = ToMemoryKey(key);

        if (_cache.TryGetValue(memoryKey, out object? value) && value is LlmCompletionResult hit)
            return Task.FromResult<LlmCompletionResult?>(hit);

        return Task.FromResult<LlmCompletionResult?>(null);
    }

    /// <inheritdoc />
    public Task SetAsync(LlmCompletionCacheKey key, LlmCompletionResult result, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        ArgumentNullException.ThrowIfNull(result);

        LlmCompletionCacheOptions options = _optionsMonitor.CurrentValue;

        if (options.MaxEntries < 1)
            throw new InvalidOperationException("LlmCompletionCacheOptions.MaxEntries must be at least 1.");

        TimeSpan ttl = ResolveTtl(options);

        MemoryCacheEntryOptions entryOptions = new() { AbsoluteExpirationRelativeToNow = ttl, Size = 1 };

        string memoryKey = ToMemoryKey(key);

        _cache.Set(memoryKey, result, entryOptions);

        return Task.CompletedTask;
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
