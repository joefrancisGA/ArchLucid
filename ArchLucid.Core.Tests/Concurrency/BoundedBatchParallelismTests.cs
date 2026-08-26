using ArchLucid.Core.Concurrency;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Concurrency;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class BoundedBatchParallelismTests
{
    [Theory]
    [InlineData(4, 25, 4)]
    [InlineData(0, 10, 10)]
    [InlineData(8, 3, 3)]
    [InlineData(-1, 0, 1)]
    public void ResolveMaxDegree_clamps_to_batch_size(int configured, int batchCount, int expected)
    {
        BoundedBatchParallelism.ResolveMaxDegree(configured, batchCount).Should().Be(expected);
    }

    [Fact]
    public async Task ForEachAsync_runs_all_items()
    {
        List<int> seen = [];

        await BoundedBatchParallelism.ForEachAsync(
            [1, 2, 3],
            configuredMaxConcurrent: 2,
            async (item, _) =>
            {
                await Task.Yield();
                lock (seen)
                    seen.Add(item);
            },
            CancellationToken.None);

        seen.Should().BeEquivalentTo([1, 2, 3]);
    }

    [Fact]
    public async Task ForEachAsync_respects_max_concurrent_degree()
    {
        int configuredMax = 2;
        int inFlight = 0;
        int peak = 0;
        object sync = new();

        await BoundedBatchParallelism.ForEachAsync(
            Enumerable.Range(0, 8).ToList(),
            configuredMax,
            async (_, _) =>
            {
                lock (sync)
                {
                    inFlight++;

                    if (inFlight > peak)
                        peak = inFlight;
                }

                await Task.Delay(25);

                lock (sync)
                    inFlight--;
            },
            CancellationToken.None);

        peak.Should().BeLessThanOrEqualTo(configuredMax);
        peak.Should().BeGreaterThanOrEqualTo(configuredMax);
    }
}
