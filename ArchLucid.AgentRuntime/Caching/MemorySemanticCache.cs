using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Caching;

/// <summary>
///     <see cref="ISemanticCache" /> backed by <see cref="IMemoryCache" /> (bounded via <see cref="MemoryCacheOptions.SizeLimit" />
///     on the supplied <see cref="MemoryCache" />).
/// </summary>
public sealed class MemorySemanticCache : ISemanticCache, IDisposable
{
    private const string KeyPrefix = "al:semantic:v1:";

    private readonly IMemoryCache _cache;

    private readonly IOptionsMonitor<LlmCompletionCacheOptions> _optionsMonitor;

    /// <summary>Creates the cache.</summary>
    public MemorySemanticCache(IMemoryCache cache, IOptionsMonitor<LlmCompletionCacheOptions> optionsMonitor)
    {
        ArgumentNullException.ThrowIfNull(cache);
        ArgumentNullException.ThrowIfNull(optionsMonitor);

        _cache = cache;
        _optionsMonitor = optionsMonitor;
    }

    /// <inheritdoc />
    public void Dispose()
    {
        if (_cache is MemoryCache memoryCache)
            memoryCache.Dispose();
    }

    /// <inheritdoc />
    public Task<string?> GetCachedResponseAsync(string promptHash, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(promptHash);
        _ = cancellationToken;

        string key = KeyPrefix + promptHash;

        if (_cache.TryGetValue(key, out object? value) && value is string hit && hit.Length > 0)
            return Task.FromResult<string?>(hit);

        return Task.FromResult<string?>(null);
    }

    /// <inheritdoc />
    public Task SetCachedResponseAsync(string promptHash, string response, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(promptHash);
        ArgumentNullException.ThrowIfNull(response);
        _ = cancellationToken;

        LlmCompletionCacheOptions options = _optionsMonitor.CurrentValue;
        TimeSpan ttl = LlmCompletionResponseCache.ResolveTtl(options);
        MemoryCacheEntryOptions entryOptions = new()
        {
            AbsoluteExpirationRelativeToNow = ttl,
            Size = 1
        };
        string key = KeyPrefix + promptHash;

        _cache.Set(key, response, entryOptions);

        return Task.CompletedTask;
    }
}
