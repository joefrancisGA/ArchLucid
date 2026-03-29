namespace ArchiForge.Persistence.RelationalRead;

/// <summary>
/// Centralizes the relational-first / JSON fallback branch without changing semantics.
/// </summary>
internal static class RelationalFirstRead
{
    /// <summary>
    /// When <paramref name="relationalRowCount"/> is positive, loads from relational tables; otherwise uses JSON columns.
    /// </summary>
    internal static async Task<T> ReadSliceAsync<T>(
        int relationalRowCount,
        Func<Task<T>> loadRelational,
        Func<T> loadJsonFallback)
    {
        if (relationalRowCount > 0)
            return await loadRelational();

        // TODO: remove JSON fallback after relational migration complete (legacy column read).
        return loadJsonFallback();
    }
}
