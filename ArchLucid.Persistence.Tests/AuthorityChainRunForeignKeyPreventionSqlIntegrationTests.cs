using ArchLucid.Persistence.Tests.Support;

using Dapper;

using FluentAssertions.Specialized;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     Asserts the SQL authority chain rejects new <c>dbo.GoldenManifests</c> rows whose <c>RunId</c>
///     is absent from <c>dbo.Runs</c> when <c>FK_GoldenManifests_Runs_RunId</c> is present (DbUp 134/147 + DDL parity).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Suite", "SqlServer")]
public sealed class AuthorityChainRunForeignKeyPreventionSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly Guid TenantId = Guid.Parse("61616161-6161-6161-6161-616161616161");

    private static readonly Guid WorkspaceId = Guid.Parse("62626262-6262-6262-6262-626262626262");

    private static readonly Guid ProjectId = Guid.Parse("63636363-6363-6363-6363-636363636363");

    [SkippableFact]
    public async Task Insert_golden_manifest_with_run_id_not_in_runs_fails_foreign_key()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        await using SqlConnection conn = new(fixture.ConnectionString);
        await conn.OpenAsync(CancellationToken.None);

        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();
        Guid traceId = Guid.NewGuid();
        Guid bogusRunId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();

        await AuthorityRunChainTestSeed.SeedFullChainAsync(
            conn,
            TenantId,
            WorkspaceId,
            ProjectId,
            runId,
            contextId,
            graphId,
            findingsId,
            traceId,
            "fk-prevent-test",
            CancellationToken.None);

        int fkPresent = await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(
                """
                SELECT COUNT(1)
                FROM sys.foreign_keys
                WHERE name = N'FK_GoldenManifests_Runs_RunId'
                  AND parent_object_id = OBJECT_ID(N'dbo.GoldenManifests');
                """,
                cancellationToken: CancellationToken.None));

        Skip.If(
            fkPresent == 0,
            "Test catalog does not define FK_GoldenManifests_Runs_RunId (unexpected for SQL persistence tests).");

        const string insertManifest = """
                                      IF NOT EXISTS (SELECT 1 FROM dbo.GoldenManifests WHERE ManifestId = @ManifestId)
                                      INSERT INTO dbo.GoldenManifests
                                      (ManifestId, RunId, ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, DecisionTraceId,
                                       CreatedUtc, ManifestHash, RuleSetId, RuleSetVersion, RuleSetHash,
                                       MetadataJson, RequirementsJson, TopologyJson, SecurityJson, ComplianceJson, CostJson,
                                       ConstraintsJson, UnresolvedIssuesJson, DecisionsJson, AssumptionsJson, WarningsJson, ProvenanceJson,
                                       TenantId, WorkspaceId, ProjectId)
                                      VALUES
                                      (@ManifestId, @RunId, @ContextSnapshotId, @GraphSnapshotId, @FindingsSnapshotId, @DecisionTraceId,
                                       SYSUTCDATETIME(), N'h', N'rs', N'1', N'rh', N'{}', N'{}', N'{}', N'{}', N'{}', N'{}',
                                       N'{}', N'{}', N'{}', N'{}', N'{}', N'{}',
                                       @TenantId, @WorkspaceId, @ProjectId);
                                      """;

        object param = new
        {
            ManifestId = manifestId,
            RunId = bogusRunId,
            ContextSnapshotId = contextId,
            GraphSnapshotId = graphId,
            FindingsSnapshotId = findingsId,
            DecisionTraceId = traceId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId
        };

        Func<Task> act = async () =>
            await conn.ExecuteAsync(new CommandDefinition(insertManifest, param, cancellationToken: CancellationToken.None));

        ExceptionAssertions<SqlException> assertion = await act.Should().ThrowAsync<SqlException>();

        assertion.Which.Number.Should().Be(547);
    }
}
