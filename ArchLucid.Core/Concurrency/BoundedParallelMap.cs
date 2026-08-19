namespace ArchLucid.Core.Concurrency;

/// <summary>
///     Order-preserving bounded-concurrency projection for read fan-out on hot paths
///     (e.g. loading many run details in parallel without exhausting the SQL connection pool).
///     Builds on <see cref="BoundedBatchParallelism" /> (TB-586).
/// </summary>
public static class BoundedParallelMap
{
    /// <summary>
    ///     Projects <paramref name="items" /> through <paramref name="selector" /> with at most
    ///     <paramref name="configuredMaxConcurrent" /> selectors in flight. Results keep the input order.
    /// </summary>
    public static async Task<TResult[]> MapAsync<TSource, TResult>(
        IReadOnlyList<TSource> items,
        int configuredMaxConcurrent,
        Func<TSource, CancellationToken, Task<TResult>> selector,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(items);
        ArgumentNullException.ThrowIfNull(selector);

        if (items.Count == 0)
            return [];

        // Fan out over indexes so each parallel body writes to its own result slot (order preserved, no locking).
        TResult[] results = new TResult[items.Count];
        IReadOnlyList<int> indexes = Enumerable.Range(0, items.Count).ToList();

        await BoundedBatchParallelism.ForEachAsync(
            indexes,
            configuredMaxConcurrent,
            async (index, ct) => results[index] = await selector(items[index], ct).ConfigureAwait(false),
            cancellationToken).ConfigureAwait(false);

        return results;
    }
}
