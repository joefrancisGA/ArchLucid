using System.Globalization;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Support;

/// <summary>
///     Temporarily disables trusted FK constraints on <c>dbo.FindingsSnapshots</c> so probe tests can seed orphan rows.
/// </summary>
internal static class FindingsSnapshotOrphanProbeTestSupport
{
    private static readonly string[] OrphanProbeForeignKeyNames =
    [
        "FK_FindingsSnapshots_Runs_RunId",
        "FK_FindingsSnapshots_ContextSnapshots_ContextSnapshotId",
        "FK_FindingsSnapshots_GraphSnapshots_GraphSnapshotId"
    ];

    internal static async Task<IReadOnlyList<string>> DisableOrphanProbeForeignKeysAsync(
        SqlConnection connection,
        CancellationToken ct)
    {
        List<string> disabled = [];

        foreach (string fkName in OrphanProbeForeignKeyNames)
        {
            object? fkRow = await connection.ExecuteScalarAsync(
                new CommandDefinition(
                    """
                    SELECT COUNT(1)
                    FROM sys.foreign_keys
                    WHERE name = @FkName
                      AND parent_object_id = OBJECT_ID(N'dbo.FindingsSnapshots');
                    """,
                    new { FkName = fkName },
                    cancellationToken: ct));

            int fkHits = fkRow is int i ? i : Convert.ToInt32(fkRow ?? 0, CultureInfo.InvariantCulture);

            if (fkHits <= 0)
                continue;

            await connection.ExecuteAsync(
                new CommandDefinition(
                    $"ALTER TABLE dbo.FindingsSnapshots NOCHECK CONSTRAINT [{fkName}];",
                    cancellationToken: ct));

            disabled.Add(fkName);
        }

        return disabled;
    }

    internal static async Task TryReEnableOrphanProbeForeignKeysAsync(
        SqlConnection connection,
        IReadOnlyList<string> disabledForeignKeyNames,
        CancellationToken ct)
    {
        foreach (string fkName in disabledForeignKeyNames)
        {
            try
            {
                await connection.ExecuteAsync(
                    new CommandDefinition(
                        $"ALTER TABLE dbo.FindingsSnapshots WITH CHECK CHECK CONSTRAINT [{fkName}];",
                        cancellationToken: ct));
            }
            catch (SqlException)
            {
                // Orphan probe rows may remain until cleanup; re-trust only when valid.
            }
        }
    }
}
