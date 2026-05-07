namespace ArchLucid.Persistence.Tests;

public sealed class HybridHotPathReadCacheTests
{
    [SkippableFact]
    public async Task GetOrCreateAsync_second_call_does_not_invoke_factory()
    {
        int calls = 0;

        HybridHotPathReadCache cache =
            HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions { AbsoluteExpirationSeconds = 60 });

        string? first = await cache.GetOrCreateAsync("k1", Factory, CancellationToken.None);
        string? second = await cache.GetOrCreateAsync("k1", Factory, CancellationToken.None);

        first.Should().Be("x");
        second.Should().Be("x");
        calls.Should().Be(1);
        return;

        async Task<string?> Factory(CancellationToken _)
        {
            calls++;

            return await Task.FromResult("x");
        }
    }

    [SkippableFact]
    public async Task GetOrCreateAsync_negative_cache_materializes_factory_once()
    {
        int calls = 0;

        HybridHotPathReadCache cache =
            HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions { AbsoluteExpirationSeconds = 60 });

        string? a = await cache.GetOrCreateAsync("k-null", Factory, CancellationToken.None);
        string? b = await cache.GetOrCreateAsync("k-null", Factory, CancellationToken.None);

        a.Should().BeNull();
        b.Should().BeNull();
        calls.Should().Be(1);
        return;

        async Task<string?> Factory(CancellationToken _)
        {
            calls++;

            return await Task.FromResult<string?>(null);
        }
    }

    [SkippableFact]
    public async Task RemoveAsync_drops_entry()
    {
        HybridHotPathReadCache cache =
            HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions { AbsoluteExpirationSeconds = 60 });

        int calls = 0;

        await cache.GetOrCreateAsync("evict", Factory, CancellationToken.None);
        await cache.RemoveAsync("evict", CancellationToken.None);
        await cache.GetOrCreateAsync("evict", Factory, CancellationToken.None);

        calls.Should().Be(2);
        return;

        async Task<string?> Factory(CancellationToken _)
        {
            calls++;

            return await Task.FromResult("v");
        }
    }
}
