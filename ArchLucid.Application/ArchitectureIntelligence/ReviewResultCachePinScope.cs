namespace ArchLucid.Application.ArchitectureIntelligence;

internal sealed class ReviewResultCachePinScope : IReviewResultCachePinScope
{
    private ReviewResultCache? _cache;
    private string? _storageKey;
    private bool _pinned;

    public ReviewResultCachePinScope(ReviewResultCache cache, string storageKey)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _storageKey = storageKey ?? throw new ArgumentNullException(nameof(storageKey));

        _pinned = _cache.PinStorageKey(_storageKey);
    }

    public bool IsPinned => _pinned;

    public void Dispose()
    {
        if (_cache is null || _storageKey is null || !_pinned)
            return;

        _cache.UnpinStorageKey(_storageKey);
        _cache = null;
        _storageKey = null;
        _pinned = false;
    }
}
