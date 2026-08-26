namespace ArchLucid.Application.ArchitectureIntelligence;

internal sealed class ReviewResultCachePinScope : IDisposable
{
    private ReviewResultCache? _cache;
    private string? _storageKey;

    public ReviewResultCachePinScope(ReviewResultCache cache, string storageKey)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _storageKey = storageKey ?? throw new ArgumentNullException(nameof(storageKey));

        _cache.PinStorageKey(_storageKey);
    }

    public void Dispose()
    {
        if (_cache is null || _storageKey is null)
            return;

        _cache.UnpinStorageKey(_storageKey);
        _cache = null;
        _storageKey = null;
    }
}
