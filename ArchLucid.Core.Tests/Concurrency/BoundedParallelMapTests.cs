using ArchLucid.Core.Concurrency;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Concurrency;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class BoundedParallelMapTests
{
    [Fact]
    public async Task MapAsync_returns_empty_for_empty_input()
    {
        int[] results = await BoundedParallelMap.MapAsync<int, int>(
            [],
            configuredMaxConcurrent: 4,
            (item, _) => Task.FromResult(item),
            CancellationToken.None);

        results.Should().BeEmpty();
    }

    [Fact]
    public async Task MapAsync_preserves_input_order()
    {
        IReadOnlyList<int> items = Enumerable.Range(0, 50).ToList();

        int[] results = await BoundedParallelMap.MapAsync(
            items,
            configuredMaxConcurrent: 8,
            async (item, ct) =>
            {
                // Vary completion timing so ordering must come from index mapping, not completion order.
                await Task.Delay(item % 3, ct);

                return item * 2;
            },
            CancellationToken.None);

        results.Should().Equal(items.Select(static item => item * 2));
    }

    [Fact]
    public async Task MapAsync_never_exceeds_configured_concurrency()
    {
        int active = 0;
        int maxObserved = 0;

        await BoundedParallelMap.MapAsync(
            Enumerable.Range(0, 32).ToList(),
            configuredMaxConcurrent: 4,
            async (_, ct) =>
            {
                int current = Interlocked.Increment(ref active);
                InterlockedMax(ref maxObserved, current);
                await Task.Delay(10, ct);
                Interlocked.Decrement(ref active);

                return 0;
            },
            CancellationToken.None);

        maxObserved.Should().BeLessThanOrEqualTo(4);
    }

    [Fact]
    public async Task MapAsync_throws_for_null_items()
    {
        Func<Task> act = async () => await BoundedParallelMap.MapAsync<int, int>(
            null!,
            configuredMaxConcurrent: 2,
            (item, _) => Task.FromResult(item),
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task MapAsync_throws_for_null_selector()
    {
        Func<Task> act = async () => await BoundedParallelMap.MapAsync<int, int>(
            [1],
            configuredMaxConcurrent: 2,
            selector: null!,
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    /// <summary>Lock-free running maximum; CompareExchange retries when another thread won the race.</summary>
    private static void InterlockedMax(ref int target, int value)
    {
        int snapshot = Volatile.Read(ref target);

        while (value > snapshot)
        {
            int previous = Interlocked.CompareExchange(ref target, value, snapshot);

            if (previous == snapshot)
                return;

            snapshot = previous;
        }
    }
}
