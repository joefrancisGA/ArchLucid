using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Decisioning.Validation;

public sealed class SchemaValidationCache
{
    private readonly ConcurrentDictionary<string, SchemaValidationResult>? _resultCache;
    private readonly SchemaValidationOptions _options;

    public SchemaValidationCache(SchemaValidationOptions options)
    {
        _options = options ?? throw new ArgumentNullException(nameof(options));

        if (_options.EnableResultCaching)

            _resultCache = new ConcurrentDictionary<string, SchemaValidationResult>(StringComparer.Ordinal);
    }

    public bool IsEnabled => _resultCache is not null;

    public bool TryGet(string schemaName, string json, out SchemaValidationResult result)
    {
        if (_resultCache is null)
        {
            result = null!;
            return false;
        }

        string cacheKey = ComputeHash(schemaName, json);
        return _resultCache.TryGetValue(cacheKey, out result!);
    }

    public void Add(string schemaName, string json, SchemaValidationResult result)
    {
        if (_resultCache is null)
            return;

        string cacheKey = ComputeHash(schemaName, json);

        if (_resultCache.Count >= _options.ResultCacheMaxSize)

            _resultCache.Clear();

        _resultCache.TryAdd(cacheKey, result);
    }

    internal static string ComputeHash(string schemaName, string json)
    {
        byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(schemaName + "|" + json));
        return Convert.ToHexString(bytes);
    }
}
