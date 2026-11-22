using ArchLucid.Core.Concurrency;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Concurrency;

[Trait("Category", "Unit")]
public sealed class InProcessCreateRunIdempotencyLockTests
{
    [Fact]
    public async Task ConcurrentWaiterCannotBeBypassedByIdleGateEviction()
    {
        // One cached key, immediate idle eviction, and three competing calls
        // make eviction pressure deterministic without a five-minute delay.
        InProcessCreateRunIdempotencyLock sut = new(capacity: 1, idleTtl: TimeSpan.Zero);
        IAsyncDisposable holder = await sut.AcquireExclusiveSessionLockAsync(
            "shared", lockTimeoutMs: 0, CancellationToken.None);

        Task<IAsyncDisposable> queued = sut.AcquireExclusiveSessionLockAsync(
            "shared", lockTimeoutMs: 2000, CancellationToken.None);
        queued.IsCompleted.Should().BeFalse("the first scope still holds the same gate");

        IAsyncDisposable distinct = await sut.AcquireExclusiveSessionLockAsync(
            "another-key", lockTimeoutMs: 0, CancellationToken.None);
        await distinct.DisposeAsync();

        // Eviction may remove an idle unrelated entry, not a referenced gate.
        sut.CachedGateCount.Should().Be(1);
        Func<Task> competing = () => sut.AcquireExclusiveSessionLockAsync(
            "shared", lockTimeoutMs: 20, CancellationToken.None);
        await competing.Should().ThrowAsync<TimeoutException>();

        await holder.DisposeAsync();
        IAsyncDisposable queuedHolder = await queued.WaitAsync(TimeSpan.FromSeconds(2));

        Func<Task> stillExcluded = () => sut.AcquireExclusiveSessionLockAsync(
            "shared", lockTimeoutMs: 20, CancellationToken.None);
        await stillExcluded.Should().ThrowAsync<TimeoutException>();

        await queuedHolder.DisposeAsync();
        IAsyncDisposable next = await sut.AcquireExclusiveSessionLockAsync(
            "shared", lockTimeoutMs: 200, CancellationToken.None);
        await next.DisposeAsync();
    }

    [Fact]
    public async Task TimeoutAndCancellationReleaseWaiterReservations()
    {
        InProcessCreateRunIdempotencyLock sut = new(capacity: 1, idleTtl: TimeSpan.Zero);
        IAsyncDisposable held = await sut.AcquireExclusiveSessionLockAsync(
            "shared", lockTimeoutMs: 0, CancellationToken.None);

        Func<Task> timedOut = () => sut.AcquireExclusiveSessionLockAsync(
            "shared", lockTimeoutMs: 20, CancellationToken.None);
        await timedOut.Should().ThrowAsync<TimeoutException>();

        using CancellationTokenSource cts = new();
        Task<IAsyncDisposable> canceledWait = sut.AcquireExclusiveSessionLockAsync(
            "shared", lockTimeoutMs: 0, cts.Token);
        cts.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => canceledWait);

        IAsyncDisposable unrelated = await sut.AcquireExclusiveSessionLockAsync(
            "another-key", lockTimeoutMs: 0, CancellationToken.None);
        await unrelated.DisposeAsync();
        sut.CachedGateCount.Should().Be(1, "only a live holder should protect its gate from eviction");

        await held.DisposeAsync();
        IAsyncDisposable acquired = await sut.AcquireExclusiveSessionLockAsync(
            "shared", lockTimeoutMs: 200, CancellationToken.None);
        await acquired.DisposeAsync();
    }

    [Fact]
    public async Task DisposingLeaseTwiceDoesNotReleaseAnotherHoldersSemaphore()
    {
        InProcessCreateRunIdempotencyLock sut = new();
        IAsyncDisposable first = await sut.AcquireExclusiveSessionLockAsync(
            "shared", lockTimeoutMs: 0, CancellationToken.None);

        await first.DisposeAsync();
        IAsyncDisposable second = await sut.AcquireExclusiveSessionLockAsync(
            "shared", lockTimeoutMs: 200, CancellationToken.None);

        await first.DisposeAsync();
        Func<Task> competing = () => sut.AcquireExclusiveSessionLockAsync(
            "shared", lockTimeoutMs: 20, CancellationToken.None);
        await competing.Should().ThrowAsync<TimeoutException>();

        await second.DisposeAsync();
    }

    [Fact]
    public async Task WaiterAcquiresAfterReleaseUnderRepeatedCapacityPressure()
    {
        InProcessCreateRunIdempotencyLock sut = new(capacity: 1, idleTtl: TimeSpan.Zero);
        IAsyncDisposable first = await sut.AcquireExclusiveSessionLockAsync(
            "shared", lockTimeoutMs: 0, CancellationToken.None);
        Task<IAsyncDisposable> waiter = sut.AcquireExclusiveSessionLockAsync(
            "shared", lockTimeoutMs: 2000, CancellationToken.None);

        for (int i = 0; i < 25; i++)
        {
            IAsyncDisposable spare = await sut.AcquireExclusiveSessionLockAsync(
                $"unrelated-{i}", lockTimeoutMs: 0, CancellationToken.None);
            await spare.DisposeAsync();
        }

        await first.DisposeAsync();
        IAsyncDisposable second = await waiter.WaitAsync(TimeSpan.FromSeconds(2));
        Func<Task> competing = () => sut.AcquireExclusiveSessionLockAsync(
            "shared", lockTimeoutMs: 20, CancellationToken.None);
        await competing.Should().ThrowAsync<TimeoutException>();
        await second.DisposeAsync();
    }
}
