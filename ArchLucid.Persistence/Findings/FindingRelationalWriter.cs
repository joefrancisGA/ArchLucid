using ArchLucid.Contracts.Findings;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Writes a <see cref="FindingsSnapshot" /> into the relational finding tables. Ordering matters: each finding gets a
///     stable <c>SortOrder</c> from its snapshot position, and child rows are inserted after the parent record so foreign
///     keys hold inside the caller's transaction.
/// </summary>
internal static partial class FindingRelationalWriter
{
    public static async Task InsertSnapshotFindingsAsync(
        FindingsSnapshot snapshot,
        System.Data.IDbConnection connection,
        System.Data.IDbTransaction? transaction,
        FindingRelationalScope scope,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(scope);

        for (int sortOrder = 0; sortOrder < snapshot.Findings.Count; sortOrder++)
        {
            Finding finding = snapshot.Findings[sortOrder];
            Guid recordId = Guid.NewGuid();

            await InsertFindingRecordAsync(
                connection,
                transaction,
                snapshot.FindingsSnapshotId,
                recordId,
                sortOrder,
                finding,
                scope,
                ct);

            await InsertFindingChildrenAsync(connection, transaction, recordId, finding, scope, ct);
        }
    }
}
