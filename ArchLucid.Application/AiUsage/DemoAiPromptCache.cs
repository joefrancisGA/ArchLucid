using System.Collections.Concurrent;

using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.AiUsage;

public sealed class DemoAiPromptCache(IOptionsMonitor<AiUsageControlsOptions> aiUsageOptions) : IDemoAiPromptCache
{
    private readonly ConcurrentDictionary<string, string> _entries = new(StringComparer.Ordinal);
    private readonly object _writeLock = new();

    private readonly IOptionsMonitor<AiUsageControlsOptions> _aiUsageOptions =
        aiUsageOptions ?? throw new ArgumentNullException(nameof(aiUsageOptions));

    public bool TryGet(string cacheKey, out string responseJson) => _entries.TryGetValue(cacheKey, out responseJson!);

    public void Set(string cacheKey, string responseJson)
    {
        lock (_writeLock)
        {
            int maxEntries = Math.Max(16, _aiUsageOptions.CurrentValue.DemoPromptCacheMaxEntries);
            int entriesToRemove = _entries.Count - maxEntries + (_entries.ContainsKey(cacheKey) ? 0 : 1);

            if (entriesToRemove > 0)
            {
                foreach (string key in _entries.Keys.Where(key => key != cacheKey).Take(entriesToRemove))
                {
                    _entries.TryRemove(key, out _);
                }
            }

            _entries[cacheKey] = responseJson;
        }
    }
}
