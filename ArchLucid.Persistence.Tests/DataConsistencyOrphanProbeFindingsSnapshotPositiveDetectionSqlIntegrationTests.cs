using ArchLucid.Host.Core.DataConsistency;

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

        Guid orphanRunId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsSnapId = Guid.NewGuid();

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync(CancellationToken.None);

        const string insertOrphanFindings = """
                                            INSERT INTO dbo.FindingsSnapshots
                                            (
                                                FindingsSnapshotId, RunId, ContextSnapshotId, GraphSnapshotId,
                                                TenantId, WorkspaceId, ProjectId,
                                                CreatedUtc, SchemaVersion, GenerationStatus, FindingsJson
                                            )
                                            VALUES
                                            (
                                                @FindingsSnapshotId, @RunId, @ContextSnapshotId, @GraphSnapshotId,
                                                @TenantId, @WorkspaceId, @ProjectId,
                                                SYSUTCDATETIME(), 1, N'Complete', N'{"findings":[]}'
                                            );
                                            """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertOrphanFindings,
                new
                {
                    FindingsSnapshotId = findingsSnapId,
                    RunId = orphanRunId,
                    ContextSnapshotId = contextId,
                    GraphSnapshotId = graphId,
                    TenantId = SeedTenantId,
                    WorkspaceId = SeedWorkspaceId,
                    ProjectId = SeedScopeProjectId,
                },
                cancellationToken: CancellationToken.None));

        long orphanCount = await connection.ExecuteScalarAsync<long>(
            new CommandDefinition(DataConsistencyOrphanProbeSql.FindingsSnapshotsRunId, cancellationToken: CancellationToken.None));

        orphanCount.Should().BeGreaterThan(0);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "DELETE FROM dbo.FindingsSnapshots WHERE FindingsSnapshotId = @FindingsSnapshotId;",
                new { FindingsSnapshotId = findingsSnapId },
                cancellationToken: CancellationToken.None));
    }
}
