namespace ArchLucid.Persistence.Queries;

/// <summary>
/// Soft-fails optional buyer-summary side loads so SSR never 500s when a satellite row is corrupt.
/// </summary>
internal static class BuyerSummaryOptionalLoad
{
    internal static async Task<T?> SoftAsync<T>(Func<CancellationToken, Task<T?>> load, CancellationToken ct)
        where T : class
    {
        ArgumentNullException.ThrowIfNull(load);

        try
        {
            return await load(ct).ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception)
        {
            return null;
        }
    }

    internal static async Task<IReadOnlyList<string>> SoftListAsync(
        Func<CancellationToken, Task<IReadOnlyList<string>>> load,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(load);

        try
        {
            return await load(ct).ConfigureAwait(false) ?? [];
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception)
        {
            return [];
        }
    }
}
