using System.Data;

using Dapper;

namespace ArchLucid.Persistence.ContextSnapshots;

internal static partial class ContextSnapshotRelationalRead
{
    private static async Task<SlicePresenceFlags> LoadSlicePresenceFlagsAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid snapshotId,
        CancellationToken ct)
    {
        // One round-trip: four EXISTS flags instead of four sequential COUNT(1) probes.
        const string sql = """
                           SELECT
                               CASE WHEN EXISTS (
                                   SELECT 1 FROM dbo.ContextSnapshotCanonicalObjects WHERE SnapshotId = @SnapshotId)
                                   THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS HasCanonicalObjects,
                               CASE WHEN EXISTS (
                                   SELECT 1 FROM dbo.ContextSnapshotWarnings WHERE SnapshotId = @SnapshotId)
                                   THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS HasWarnings,
                               CASE WHEN EXISTS (
                                   SELECT 1 FROM dbo.ContextSnapshotErrors WHERE SnapshotId = @SnapshotId)
                                   THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS HasErrors,
                               CASE WHEN EXISTS (
                                   SELECT 1 FROM dbo.ContextSnapshotSourceHashes WHERE SnapshotId = @SnapshotId)
                                   THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS HasSourceHashes;
                           """;

        SlicePresenceFlags? flags = await connection.QuerySingleAsync<SlicePresenceFlags>(
            new CommandDefinition(
                sql,
                new { SnapshotId = snapshotId },
                transaction,
                cancellationToken: ct));

        return flags ?? new SlicePresenceFlags();
    }

    private sealed class SlicePresenceFlags
    {
        public bool HasCanonicalObjects
        {
            get;
            init;
        }

        public bool HasWarnings
        {
            get;
            init;
        }

        public bool HasErrors
        {
            get;
            init;
        }

        public bool HasSourceHashes
        {
            get;
            init;
        }
    }
}
