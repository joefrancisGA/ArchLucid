namespace ArchLucid.Retrieval.Indexing;

internal static class AzureSearchChunkDeletion
{
    internal const int PageSize = 1000;

    internal static async Task DeleteAllPagesAsync(
        Func<CancellationToken, Task<IReadOnlyList<string>>> fetchPageAsync,
        Func<IReadOnlyList<string>, CancellationToken, Task> deletePageAsync,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(fetchPageAsync);
        ArgumentNullException.ThrowIfNull(deletePageAsync);

        while (true)
        {
            IReadOnlyList<string> chunkIds = await fetchPageAsync(cancellationToken).ConfigureAwait(false);

            if (chunkIds.Count == 0)
                return;

            await deletePageAsync(chunkIds, cancellationToken).ConfigureAwait(false);

            if (chunkIds.Count < PageSize)
                return;
        }
    }
}
