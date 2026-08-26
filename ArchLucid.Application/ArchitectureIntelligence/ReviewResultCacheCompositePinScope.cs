namespace ArchLucid.Application.ArchitectureIntelligence;

internal sealed class ReviewResultCacheCompositePinScope : IDisposable
{
    private ReviewResultCache? _cache;
    private readonly List<string> _storageKeys = [];

    public ReviewResultCacheCompositePinScope(ReviewResultCache cache, IEnumerable<string> storageKeys)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        ArgumentNullException.ThrowIfNull(storageKeys);

        foreach (string storageKey in storageKeys)
        {
            if (string.IsNullOrWhiteSpace(storageKey))
                continue;

            _cache.PinStorageKey(storageKey);
            _storageKeys.Add(storageKey);
        }
    }

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
