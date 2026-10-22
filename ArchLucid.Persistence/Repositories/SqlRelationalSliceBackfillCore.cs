using System.Data;

using ArchLucid.Persistence.RelationalRead;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Shared COUNT-then-insert-if-empty helpers for JSON→relational slice backfill in snapshot/artifact repositories.
/// </summary>
internal static class SqlRelationalSliceBackfillCore
{
    /// <summary>Returns the row count for a relational slice table via <c>COUNT(1)</c>.</summary>
    public static Task<int> CountSliceRowsAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        string countSql,
        object param,
        CancellationToken ct) =>
        SqlRelationalScalarCount.ExecuteAsync(connection, transaction, countSql, param, ct);

    /// <summary>
    ///     Returns true when the slice table is empty but the in-memory source collection has items to backfill.
    /// </summary>
    public static bool SliceNeedsBackfill(int sliceRowCount, int sourceItemCount) =>
        sliceRowCount == 0 && sourceItemCount > 0;
}
