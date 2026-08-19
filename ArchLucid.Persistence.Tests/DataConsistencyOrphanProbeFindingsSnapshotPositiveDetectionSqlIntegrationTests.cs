using System.Globalization;

using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Persistence.Tests.Support;

using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     Positive detection for orphan <c>dbo.FindingsSnapshots</c> rows whose <c>RunId</c> is missing from
///     <c>dbo.Runs</c> (cross-run consistency / remediation alignment).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DataConsistencyOrphanProbeFindingsSnapshotPositiveDetectionSqlIntegrationTests(
    SqlServerPersistenceFixture fixture)
{
    private static readonly Guid SeedTenantId = Guid.Parse("90909090-9090-9090-9090-909090909090");
    private static readonly Guid SeedWorkspaceId = Guid.Parse("91919191-9191-9191-9191-919191919191");
    private static readonly Guid SeedScopeProjectId = Guid.Parse("92929292-9292-9292-9292-929292929292");

    [SkippableFact]
    public async Task FindingsSnapshotsRunId_probe_detects_orphan_row_without_matching_run()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid runId = Guid.NewGuid();
        Guid orphanRunId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsSnapId = Guid.NewGuid();
        Guid decisionTraceId = Guid.NewGuid();
        bool nchecked = false;

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync(CancellationToken.None);

        try
        {
            await AuthorityRunChainTestSeed.SeedFullChainAsync(
                connection,
                SeedTenantId,
                SeedWorkspaceId,
                SeedScopeProjectId,
                runId,
                contextId,
                graphId,
                findingsSnapId,
                decisionTraceId,
                "orphan-findings-probe",
                CancellationToken.None);

            object? fkRow = await connection.ExecuteScalarAsync(
                new CommandDefinition(
                    """
                    SELECT COUNT(1)
                    FROM sys.foreign_keys
                    WHERE name = N'FK_FindingsSnapshots_Runs_RunId'
                      AND parent_object_id = OBJECT_ID(N'dbo.FindingsSnapshots');
                    """,
                    cancellationToken: CancellationToken.None));

            int fkHits = fkRow is int i ? i : Convert.ToInt32(fkRow ?? 0, CultureInfo.InvariantCulture);

            if (fkHits > 0)
            {
                await connection.ExecuteAsync(
                    new CommandDefinition(
                        "ALTER TABLE dbo.FindingsSnapshots NOCHECK CONSTRAINT FK_FindingsSnapshots_Runs_RunId;",
                        cancellationToken: CancellationToken.None));

                nchecked = true;
            }

            await connection.ExecuteAsync(
                new CommandDefinition(
                    """
                    UPDATE dbo.FindingsSnapshots
                    SET RunId = @OrphanRunId
                    WHERE FindingsSnapshotId = @FindingsSnapshotId;
                    """,
                    new
                    {
                        OrphanRunId = orphanRunId,
                        FindingsSnapshotId = findingsSnapId,
                    },
                    cancellationToken: CancellationToken.None));

            long orphanCount = await connection.ExecuteScalarAsync<long>(
                new CommandDefinition(DataConsistencyOrphanProbeSql.FindingsSnapshotsRunId, cancellationToken: CancellationToken.None));

            orphanCount.Should().BeGreaterThan(0);
        }
        finally
        {
            await connection.ExecuteAsync(
                new CommandDefinition(
                    "DELETE FROM dbo.FindingsSnapshots WHERE FindingsSnapshotId = @FindingsSnapshotId;",
                    new { FindingsSnapshotId = findingsSnapId },
                    cancellationToken: CancellationToken.None));

            if (nchecked)
            {
                try
                {
                    await connection.ExecuteAsync(
                        new CommandDefinition(
                            """
                            ALTER TABLE dbo.FindingsSnapshots WITH CHECK CHECK CONSTRAINT FK_FindingsSnapshots_Runs_RunId;
                            """,
                            cancellationToken: CancellationToken.None));
                }
                catch (SqlException)
                {
                    // Other parallel tests may leave orphan rows; re-trust only when valid.
                }
            }
        }
    }
}
