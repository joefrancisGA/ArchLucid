using System.Collections.Concurrent;

using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.AiUsage;

public sealed class DemoAiPromptCache(IOptionsMonitor<AiUsageControlsOptions> aiUsageOptions) : IDemoAiPromptCache
{
    private readonly ConcurrentDictionary<string, string> _entries = new(StringComparer.Ordinal);

    private readonly IOptionsMonitor<AiUsageControlsOptions> _aiUsageOptions =
        aiUsageOptions ?? throw new ArgumentNullException(nameof(aiUsageOptions));

    public bool TryGet(string cacheKey, out string responseJson) => _entries.TryGetValue(cacheKey, out responseJson!);

    public void Set(string cacheKey, string responseJson)
    {
        int maxEntries = Math.Max(16, _aiUsageOptions.CurrentValue.DemoPromptCacheMaxEntries);

        if (_entries.Count >= maxEntries)
        {
            string? firstKey = _entries.Keys.FirstOrDefault();

            if (firstKey is not null)
            {
                _entries.TryRemove(firstKey, out _);
            }
        }

        _entries[cacheKey] = responseJson;
    }
}
