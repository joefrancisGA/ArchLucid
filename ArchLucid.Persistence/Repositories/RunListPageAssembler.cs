using ArchLucid.Core.Pagination;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Turns a paged run query's rows into a <see cref="RunListPage" />.
/// </summary>
/// <remarks>
///     Paged queries fetch one row beyond the page size. Its presence — not a separate COUNT — is what tells the caller
///     another page exists, so the probe row is trimmed off before the page is returned.
/// </remarks>
internal static class RunListPageAssembler
{
    /// <param name="pageSize">The clamped page size the caller asked for, excluding the probe row.</param>
    public static RunListPage FromProbedRows(IEnumerable<RunRecord> rows, int pageSize)
    {
        ArgumentNullException.ThrowIfNull(rows);

        List<RunRecord> page = rows.ToList();
        bool hasMore = page.Count > pageSize;

        if (hasMore)
            page.RemoveAt(page.Count - 1);

        return new RunListPage(page, hasMore);
    }
}
