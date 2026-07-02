namespace ArchLucid.Core.Concurrency;

/// <summary>
///     Bounded fan-out for worker outbox batch processors (TB-586).
/// </summary>
public static class BoundedBatchParallelism
{
    /// <summary>Maps configured concurrency to an effective degree capped by batch size.</summary>
    public static int ResolveMaxDegree(int configuredMaxConcurrent, int batchCount)
    {
        if (batchCount <= 0)
            return 1;

        if (configuredMaxConcurrent <= 0)
            return batchCount;

        return Math.Clamp(configuredMaxConcurrent, 1, batchCount);
    }

    public static async Task ForEachAsync<T>(
        IReadOnlyList<T> items,
        int configuredMaxConcurrent,
        Func<T, CancellationToken, Task> body,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(items);
        ArgumentNullException.ThrowIfNull(body);

        if (items.Count == 0)
            return;

        int maxDegree = ResolveMaxDegree(configuredMaxConcurrent, items.Count);

        if (maxDegree <= 1)
        {
            foreach (T item in items)

                await body(item, cancellationToken).ConfigureAwait(false);

            return;
        }

        ParallelOptions options = new()
        {
            MaxDegreeOfParallelism = maxDegree,
            CancellationToken = cancellationToken,
        };

        await Parallel.ForEachAsync(items, options, async (item, ct) =>
        {
            await body(item, ct).ConfigureAwait(false);
        }).ConfigureAwait(false);
    }
}
