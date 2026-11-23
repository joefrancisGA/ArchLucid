using System.Data.SqlTypes;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>
///     Match SQL Server's composite (CreatedUtc, uniqueidentifier Id) ordering.
///     Guid.CompareTo uses a different byte order than SQL Server for tied timestamps.
/// </summary>
internal static class TenantWorkspaceOrdering
{
    public static IOrderedEnumerable<T> OrderByCreatedUtcThenSqlId<T>(
        IEnumerable<T> rows,
        Func<T, DateTimeOffset> createdUtc,
        Func<T, Guid> workspaceId)
    {
        ArgumentNullException.ThrowIfNull(rows);
        ArgumentNullException.ThrowIfNull(createdUtc);
        ArgumentNullException.ThrowIfNull(workspaceId);

        return rows.OrderBy(createdUtc)
            .ThenBy(row => new SqlGuid(workspaceId(row)));
    }
}
