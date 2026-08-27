namespace ArchLucid.Application.ArchitectureIntelligence;

internal sealed class ReviewResultCacheCompositePinScope : IReviewResultCachePinScope
{
    private ReviewResultCache? _cache;
    private readonly List<string> _storageKeys = [];
    private readonly int _requestedDistinctKeys;

    public ReviewResultCacheCompositePinScope(ReviewResultCache cache, IEnumerable<string> storageKeys)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        ArgumentNullException.ThrowIfNull(storageKeys);

        List<string> distinctKeys = storageKeys
            .Where(key => !string.IsNullOrWhiteSpace(key))
            .Distinct(StringComparer.Ordinal)
            .ToList();

        _requestedDistinctKeys = distinctKeys.Count;

        foreach (string storageKey in distinctKeys)
        {
            if (_cache.PinStorageKey(storageKey))
                _storageKeys.Add(storageKey);
        }
    }

    public bool IsPinned => _requestedDistinctKeys > 0 && _storageKeys.Count == _requestedDistinctKeys;

    public void Dispose()
    {
        if (_cache is null)
            return;

        foreach (string storageKey in _storageKeys)
            _cache.UnpinStorageKey(storageKey);

        _cache = null;
        _storageKeys.Clear();
    }
}
