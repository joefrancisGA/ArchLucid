namespace ArchiForge.Core.Pagination;

/// <summary>
/// Builds <see cref="PagedResponse{T}"/> from an already-loaded collection.
/// This is a v1 convenience for controller-level pagination; SQL-level OFFSET/FETCH should replace this for large datasets.
/// </summary>
public static class PagedResponseBuilder
{
    /// <summary>
    /// Applies in-memory skip/take over <paramref name="allItems"/> and wraps the result in a <see cref="PagedResponse{T}"/>.
    /// </summary>
    public static PagedResponse<T> Build<T>(IReadOnlyList<T> allItems, int page, int pageSize)
    {
        (int safePage, int safePageSize) = PaginationDefaults.Normalize(page, pageSize);
        int skip = PaginationDefaults.ToSkip(safePage, safePageSize);

        IReadOnlyList<T> items = allItems
            .Skip(skip)
            .Take(safePageSize)
            .ToList();

        return new PagedResponse<T>
        {
            Items = items,
            TotalCount = allItems.Count,
            Page = safePage,
            PageSize = safePageSize
        };
    }
}
