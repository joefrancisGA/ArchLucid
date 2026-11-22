using ArchLucid.Application.AiUsage;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.AiUsage;

[Trait("Category", "Unit")]
public sealed class DemoAiPromptCacheTests
{
    private const int Capacity = 16;

    [SkippableFact]
    public void UpdatingAnExistingEntryAtCapacityKeepsOtherEntries()
    {
        DemoAiPromptCache cache = CreateCache();
        string[] keys = Enumerable.Range(0, Capacity).Select(index => $"prompt-{index}").ToArray();
        foreach (string key in keys)
            cache.Set(key, "original");

        // Updating every key exposes eviction regardless of which key the dictionary enumerates first.
        foreach (string key in keys)
        {
            cache.Set(key, "updated");
            Assert.All(keys, candidate => Assert.True(cache.TryGet(candidate, out _), candidate));
            Assert.True(cache.TryGet(key, out string response));
            Assert.Equal("updated", response);
        }
    }

    [SkippableFact]
    public void UpdatingAnExistingEntryRespectsReducedCapacity()
    {
        AiUsageControlsOptions current = new() { DemoPromptCacheMaxEntries = Capacity * 2 };
        Mock<IOptionsMonitor<AiUsageControlsOptions>> options = new();
        options.Setup(monitor => monitor.CurrentValue).Returns(() => current);
        DemoAiPromptCache cache = new(options.Object);
        string[] keys = Enumerable.Range(0, Capacity * 2).Select(index => $"prompt-{index}").ToArray();

        foreach (string key in keys)
            cache.Set(key, "original");

        current = new AiUsageControlsOptions { DemoPromptCacheMaxEntries = Capacity };
        cache.Set(keys[0], "updated");

        Assert.Equal(Capacity, keys.Count(key => cache.TryGet(key, out _)));
        Assert.True(cache.TryGet(keys[0], out string response));
        Assert.Equal("updated", response);
    }

    [SkippableFact]
    public void ConcurrentInsertionsRespectCapacity()
    {
        DemoAiPromptCache cache = CreateCache();
        string[] keys = Enumerable.Range(0, Capacity * 4).Select(index => $"prompt-{index}").ToArray();

        Parallel.ForEach(keys, key => cache.Set(key, "response"));

        Assert.Equal(Capacity, keys.Count(key => cache.TryGet(key, out _)));
    }

    private static DemoAiPromptCache CreateCache()
    {
        Mock<IOptionsMonitor<AiUsageControlsOptions>> options = new();
        options.Setup(monitor => monitor.CurrentValue)
            .Returns(new AiUsageControlsOptions { DemoPromptCacheMaxEntries = Capacity });
        return new DemoAiPromptCache(options.Object);
    }
}
