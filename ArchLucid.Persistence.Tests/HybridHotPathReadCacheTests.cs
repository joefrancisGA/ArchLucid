namespace ArchLucid.Persistence.Tests;
[Trait("Category", "Unit")]

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
    public void HotPathTypedCacheSlot_preserves_negative_cache_semantics()
    {
        HotPathTypedCacheSlot<string> absent = new(false, null);
        HotPathTypedCacheSlot<string> present = new(true, "cached");

        absent.IsPresent.Should().BeFalse();
        absent.Value.Should().BeNull();
        present.IsPresent.Should().BeTrue();
        present.Value.Should().Be("cached");
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

    [SkippableFact]
    public async Task GetOrCreateAsync_concurrent_misses_invoke_factory_once()
    {
        int calls = 0;
        TaskCompletionSource startGate = new(TaskCreationOptions.RunContinuationsAsynchronously);

        HybridHotPathReadCache cache =
            HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions { AbsoluteExpirationSeconds = 60 });

        List<Task<string?>> tasks = Enumerable.Range(0, 8)
            .Select(_ => Task.Run(async () =>
            {
                await startGate.Task;

                return await cache.GetOrCreateAsync("burst", Factory, CancellationToken.None);
            }))
            .ToList();

        startGate.SetResult();
        string?[] results = await Task.WhenAll(tasks);

        results.Should().OnlyContain(static value => value == "burst-value");
        calls.Should().Be(1);
        return;

        async Task<string?> Factory(CancellationToken ct)
        {
            Interlocked.Increment(ref calls);

            await Task.Delay(50, ct);

            return "burst-value";
        }
    }

    [SkippableFact]
    public async Task GetOrCreateAsync_faulting_factory_coalesces_and_does_not_cache_failure()
    {
        int calls = 0;

        HybridHotPathReadCache cache =
            HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions { AbsoluteExpirationSeconds = 60 });

        TaskCompletionSource startGate = new(TaskCreationOptions.RunContinuationsAsynchronously);

        List<Task> waiters = Enumerable.Range(0, 4)
            .Select(_ => Task.Run(async () =>
            {
                await startGate.Task;

                Func<Task> act = () => cache.GetOrCreateAsync("fault", Factory, CancellationToken.None);

                await act.Should().ThrowAsync<InvalidOperationException>();
            }))
            .ToList();

        startGate.SetResult();
        await Task.WhenAll(waiters);

        calls.Should().Be(1);

        Func<Task> retry = () => cache.GetOrCreateAsync("fault", Factory, CancellationToken.None);

        await retry.Should().ThrowAsync<InvalidOperationException>();
        calls.Should().Be(2);
        return;

        async Task<string?> Factory(CancellationToken _)
        {
            Interlocked.Increment(ref calls);

            await Task.Yield();

            throw new InvalidOperationException("loader failed");
        }
    }
}
