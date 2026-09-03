using System.Data;

using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Persistence.RelationalRead;

using Dapper;

namespace ArchLucid.Persistence.ContextSnapshots;

/// <summary>
///     Hydrates <see cref="ContextSnapshot" /> from relational child tables when rows exist; otherwise legacy JSON
///     columns.
/// </summary>
internal static partial class ContextSnapshotRelationalRead
{
    public static async Task<ContextSnapshot> HydrateAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        ContextSnapshotStorageRow row,
        CancellationToken ct)
    {
        Guid snapshotId = row.SnapshotId;

        SlicePresenceFlags presence = await LoadSlicePresenceFlagsAsync(connection, transaction, snapshotId, ct);

        List<CanonicalObject> canonicalObjects = presence.HasCanonicalObjects
            ? await LoadCanonicalObjectsRelationalAsync(connection, transaction, snapshotId, ct)
            : ContextSnapshotLegacyJsonReader.DeserializeCanonicalObjects(row.CanonicalObjectsJson);

        List<string> warnings = presence.HasWarnings
            ? await LoadStringColumnRelationalAsync(
                connection,
                transaction,
                """
                SELECT WarningText AS Item
                FROM dbo.ContextSnapshotWarnings
                WHERE SnapshotId = @SnapshotId
                ORDER BY SortOrder;
                """,
                snapshotId,
                ct)
            : ContextSnapshotLegacyJsonReader.DeserializeStringList(row.WarningsJson);

        List<string> errors = presence.HasErrors
            ? await LoadStringColumnRelationalAsync(
                connection,
                transaction,
                """
                SELECT ErrorText AS Item
                FROM dbo.ContextSnapshotErrors
                WHERE SnapshotId = @SnapshotId
                ORDER BY SortOrder;
                """,
                snapshotId,
                ct)
            : ContextSnapshotLegacyJsonReader.DeserializeStringList(row.ErrorsJson);

        Dictionary<string, string> sourceHashes = presence.HasSourceHashes
            ? await LoadSourceHashesRelationalAsync(connection, transaction, snapshotId, ct)
            : ContextSnapshotLegacyJsonReader.DeserializeSourceHashes(row.SourceHashesJson);

        return new ContextSnapshot
        {
            SnapshotId = row.SnapshotId,
            RunId = row.RunId,
            ProjectId = row.ProjectId,
            CreatedUtc = row.CreatedUtc,
            CanonicalObjects = canonicalObjects,
            DeltaSummary = row.DeltaSummary,
            Warnings = warnings,
            Errors = errors,
            SourceHashes = sourceHashes
        };
    }

    private static async Task<Dictionary<string, string>> LoadSourceHashesRelationalAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid snapshotId,
        CancellationToken ct)
    {
        IEnumerable<SourceHashRow> hashRows = await connection.QueryAsync<SourceHashRow>(
            new CommandDefinition(
                """
                SELECT SourceKey, HashValue
                FROM dbo.ContextSnapshotSourceHashes
                WHERE SnapshotId = @SnapshotId
                ORDER BY SortOrder;
                """,
                new { SnapshotId = snapshotId },
                transaction,
                cancellationToken: ct));

        Dictionary<string, string> sourceHashes = new(StringComparer.Ordinal);

        foreach (SourceHashRow hr in hashRows)
            sourceHashes[hr.SourceKey] = hr.HashValue;

        return sourceHashes;
    }

    private static Task<List<string>> LoadStringColumnRelationalAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        string sql,
        Guid snapshotId,
        CancellationToken ct) =>
        RelationalSliceReadCore.LoadOrderedStringsAsync(
            connection,
            sql,
            new { SnapshotId = snapshotId },
            transaction,
            ct);

    private sealed class SourceHashRow
    {
        public string SourceKey
        {
            get;
            init;
        } = null!;

        public string HashValue
        {
            get;
            init;
        } = null!;
    }
}
