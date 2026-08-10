using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Embedding;

/// <summary>
///     Content-hash <see cref="IMemoryCache" /> decorator over <see cref="IEmbeddingService" />.
///     Identical normalized texts reuse vectors without another Azure OpenAI embedding call.
/// </summary>
public sealed class CachingEmbeddingService(
    IEmbeddingService inner,
    IMemoryCache memoryCache,
    IOptionsMonitor<EmbeddingContentHashCacheOptions> optionsMonitor) : IEmbeddingService
{
    private readonly IEmbeddingService _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly IMemoryCache _memoryCache =
        memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));

    private readonly IOptionsMonitor<EmbeddingContentHashCacheOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    /// <inheritdoc />
    public async Task<float[]> EmbedAsync(string text, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(text);

        EmbeddingContentHashCacheOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled)
            return await _inner.EmbedAsync(text, ct).ConfigureAwait(false);

        string cacheKey = BuildCacheKey(text);

        if (_memoryCache.TryGetValue(cacheKey, out float[]? cached) && cached is not null)
            return cached;

        float[] vector = await _inner.EmbedAsync(text, ct).ConfigureAwait(false);

        SetCache(cacheKey, vector, opts);

        return vector;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<float[]>> EmbedManyAsync(IReadOnlyList<string> texts, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(texts);

        EmbeddingContentHashCacheOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled || texts.Count == 0)
            return await _inner.EmbedManyAsync(texts, ct).ConfigureAwait(false);

        float[]?[] results = new float[]?[texts.Count];
        List<int> missIndexes = [];
        List<string> missTexts = [];

        for (int i = 0; i < texts.Count; i++)
        {
            string text = texts[i] ?? string.Empty;
            string cacheKey = BuildCacheKey(text);

            if (_memoryCache.TryGetValue(cacheKey, out float[]? cached) && cached is not null)
            {
                results[i] = cached;
                continue;
            }

            missIndexes.Add(i);
            missTexts.Add(text);
        }

        if (missTexts.Count == 0)
            return results.Select(static v => v!).ToList();

        IReadOnlyList<float[]> embedded = await _inner.EmbedManyAsync(missTexts, ct).ConfigureAwait(false);

        for (int m = 0; m < missIndexes.Count; m++)
        {
            float[] vector = embedded[m];
            int originalIndex = missIndexes[m];
            results[originalIndex] = vector;
            SetCache(BuildCacheKey(missTexts[m]), vector, opts);
        }

        return results.Select(static v => v!).ToList();
    }

    internal static string BuildCacheKey(string text) =>
        "embed:v1:" + EmbeddingTextContentHasher.Sha256HexUtf8Normalized(text);

    private void SetCache(string cacheKey, float[] vector, EmbeddingContentHashCacheOptions opts)
    {
        int ttlSeconds = Math.Clamp(opts.AbsoluteExpirationSeconds, 60, 86_400);

        MemoryCacheEntryOptions entryOptions = new()
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(ttlSeconds),
            Size = 1,
        };

        _memoryCache.Set(cacheKey, vector, entryOptions);
    }
}
