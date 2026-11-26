using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Findings;

internal static class FindingsSnapshotSqlTestHeader
{
    // Direct-read tests target their own seeded snapshot by ID. Use the repository projection so required
    // header fields like GenerationStatus cannot drift between these fixtures and the real SQL read.
    private static readonly string SelectHeaderById = FindingsSnapshotStatementFactory.BuildSelectHeaderById(new ScopeContext());

    internal static Task<FindingsSnapshotStorageRow> ReadAsync(
        SqlConnection connection,
        Guid findingsSnapshotId,
        CancellationToken cancellationToken) =>
        connection.QuerySingleAsync<FindingsSnapshotStorageRow>(
            new CommandDefinition(SelectHeaderById, new { FindingsSnapshotId = findingsSnapshotId },
                cancellationToken: cancellationToken));
}
