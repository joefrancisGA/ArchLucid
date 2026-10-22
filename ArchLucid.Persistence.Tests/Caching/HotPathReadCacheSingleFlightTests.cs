namespace ArchLucid.Persistence.Tests.Caching;

[Trait("Category", "Unit")]
public sealed class HotPathReadCacheSingleFlightTests
{
    [SkippableFact]
    public async Task CoalesceAsync_concurrent_leaders_invoke_work_once()
    {
        int calls = 0;
        TaskCompletionSource startGate = new(TaskCreationOptions.RunContinuationsAsynchronously);

        List<Task<string>> tasks = Enumerable.Range(0, 6)
            .Select(_ => Task.Run(async () =>
            {
                await startGate.Task;

                return await HotPathReadCacheSingleFlight.CoalesceAsync(
                    "flight-key",
                    async ct =>
                    {
                        Interlocked.Increment(ref calls);

                        await Task.Delay(40, ct);

                        return "ok";
                    },
                    CancellationToken.None);
            }))
            .ToList();

        startGate.SetResult();
        string[] results = await Task.WhenAll(tasks);

        results.Should().OnlyContain(static value => value == "ok");
        calls.Should().Be(1);
    }

    [SkippableFact]
    public async Task CoalesceAsync_fault_propagates_to_waiters_without_caching()
    {
        int calls = 0;
        TaskCompletionSource startGate = new(TaskCreationOptions.RunContinuationsAsynchronously);

        List<Task> waiters = Enumerable.Range(0, 3)
            .Select(_ => Task.Run(async () =>
            {
                await startGate.Task;

                Func<Task> act = () => HotPathReadCacheSingleFlight.CoalesceAsync<string>(
                    "fault-key",
                    async ct =>
                    {
                        Interlocked.Increment(ref calls);

                        // Hold long enough for sibling waiters to attach (same idea as the success test).
                        await Task.Delay(40, ct);

                        throw new InvalidOperationException("boom");
                    },
                    CancellationToken.None);

                await act.Should().ThrowAsync<InvalidOperationException>();
            }))
            .ToList();

        startGate.SetResult();
        await Task.WhenAll(waiters);

        calls.Should().Be(1);

        Func<Task> retry = () => HotPathReadCacheSingleFlight.CoalesceAsync<string>(
            "fault-key",
            async _ =>
            {
                Interlocked.Increment(ref calls);

                await Task.Yield();

                throw new InvalidOperationException("boom");
            },
            CancellationToken.None);

        await retry.Should().ThrowAsync<InvalidOperationException>();
        calls.Should().Be(2);
    }

    [SkippableFact]
    public async Task CoalesceAsync_records_inflight_dedupe_for_followers()
    {
        long before = ArchLucid.Core.Diagnostics.ArchLucidInstrumentation.GetCacheTelemetrySnapshot()
            .HotPathReadCacheInFlightDeduped;

        int calls = 0;
        TaskCompletionSource startGate = new(TaskCreationOptions.RunContinuationsAsynchronously);

        List<Task<string>> tasks = Enumerable.Range(0, 4)
            .Select(_ => Task.Run(async () =>
            {
                await startGate.Task;

                return await HotPathReadCacheSingleFlight.CoalesceAsync(
                    "dedupe-key",
                    async ct =>
                    {
                        Interlocked.Increment(ref calls);

                        await Task.Delay(30, ct);

                        return "dedupe";
                    },
                    CancellationToken.None);
            }))
            .ToList();

        startGate.SetResult();
        await Task.WhenAll(tasks);

        calls.Should().Be(1);

        long after = ArchLucid.Core.Diagnostics.ArchLucidInstrumentation.GetCacheTelemetrySnapshot()
            .HotPathReadCacheInFlightDeduped;

        (after - before).Should().Be(3);
    }
}
