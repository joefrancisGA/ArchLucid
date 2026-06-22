using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Tests.Support;

using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;

using Polly;

namespace ArchLucid.Persistence.Tests.Integrations;

/// <summary>
///     TB-390 — inbound ITSM human-review sync must update only the correlated <c>FindingRecords</c> snapshot row.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Integration")]
public sealed class SqlItsmFindingCorrelationRepositoryInboundSnapshotScopingSqlIntegrationTests(
    SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task UpdateHumanReviewStatusForFindingAsync_updates_only_correlated_snapshot_row()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory connectionFactory = new(fixture.ConnectionString);
        DapperTenantRepository tenants = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(connectionFactory);
        SqlItsmFindingCorrelationRepository sut = CreateRepository(connectionFactory);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runOlderId = Guid.NewGuid();
        Guid runNewerId = Guid.NewGuid();
        Guid findingsOlderId = Guid.NewGuid();
        Guid findingsNewerId = Guid.NewGuid();
        Guid recordOlderId = Guid.NewGuid();
        Guid recordNewerId = Guid.NewGuid();
        Guid manifestOlderId = Guid.NewGuid();
        Guid manifestNewerId = Guid.NewGuid();
        const string sharedFindingId = "tb390-shared-finding";

        await SeedTenantAsync(connectionFactory, tenants, tenantId, workspaceId, projectId);

        DateTime olderCompleted = DateTime.UtcNow.AddHours(-2);
        DateTime newerCompleted = DateTime.UtcNow.AddHours(-1);

        await SeedCommittedRunFindingAsync(
            connectionFactory,
            tenantId,
            workspaceId,
            projectId,
            runOlderId,
            findingsOlderId,
            recordOlderId,
            manifestOlderId,
            sharedFindingId,
            olderCompleted,
            "Pending");

        await SeedCommittedRunFindingAsync(
            connectionFactory,
            tenantId,
            workspaceId,
            projectId,
            runNewerId,
            findingsNewerId,
            recordNewerId,
            manifestNewerId,
            sharedFindingId,
            newerCompleted,
            "Pending");

        await sut.RegisterAsync(
            tenantId,
            workspaceId,
            projectId,
            sharedFindingId,
            "Jira",
            "TB390-1",
            null,
            recordNewerId,
            CancellationToken.None);

        int updated = await sut.UpdateHumanReviewStatusForFindingAsync(
            tenantId,
            sharedFindingId,
            "Approved",
            recordNewerId,
            CancellationToken.None);

        updated.Should().Be(1);

        string olderStatus = await ReadHumanReviewStatusAsync(connectionFactory, recordOlderId);
        string newerStatus = await ReadHumanReviewStatusAsync(connectionFactory, recordNewerId);

        olderStatus.Should().Be("Pending");
        newerStatus.Should().Be("Approved");
    }

    [SkippableFact]
    public async Task UpdateHumanReviewStatusForFindingAsync_without_finding_record_id_updates_latest_committed_row_only()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory connectionFactory = new(fixture.ConnectionString);
        DapperTenantRepository tenants = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(connectionFactory);
        SqlItsmFindingCorrelationRepository sut = CreateRepository(connectionFactory);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runOlderId = Guid.NewGuid();
        Guid runNewerId = Guid.NewGuid();
        Guid findingsOlderId = Guid.NewGuid();
        Guid findingsNewerId = Guid.NewGuid();
        Guid recordOlderId = Guid.NewGuid();
        Guid recordNewerId = Guid.NewGuid();
        Guid manifestOlderId = Guid.NewGuid();
        Guid manifestNewerId = Guid.NewGuid();
        const string sharedFindingId = "tb390-fallback-finding";

        await SeedTenantAsync(connectionFactory, tenants, tenantId, workspaceId, projectId);

        DateTime olderCompleted = DateTime.UtcNow.AddHours(-2);
        DateTime newerCompleted = DateTime.UtcNow.AddHours(-1);

        await SeedCommittedRunFindingAsync(
            connectionFactory,
            tenantId,
            workspaceId,
            projectId,
            runOlderId,
            findingsOlderId,
            recordOlderId,
            manifestOlderId,
            sharedFindingId,
            olderCompleted,
            "Pending");

        await SeedCommittedRunFindingAsync(
            connectionFactory,
            tenantId,
            workspaceId,
            projectId,
            runNewerId,
            findingsNewerId,
            recordNewerId,
            manifestNewerId,
            sharedFindingId,
            newerCompleted,
            "Pending");

        int updated = await sut.UpdateHumanReviewStatusForFindingAsync(
            tenantId,
            sharedFindingId,
            "Rejected",
            findingRecordId: null,
            CancellationToken.None);

        updated.Should().Be(1);

        string olderStatus = await ReadHumanReviewStatusAsync(connectionFactory, recordOlderId);
        string newerStatus = await ReadHumanReviewStatusAsync(connectionFactory, recordNewerId);

        olderStatus.Should().Be("Pending");
        newerStatus.Should().Be("Rejected");
    }

    private static SqlItsmFindingCorrelationRepository CreateRepository(TestSqlConnectionFactory connectionFactory)
    {
        ResiliencePipeline pipeline = SqlOpenResilienceDefaults.BuildSqlOperationRetryPipeline(
            maxRetryAttempts: 0,
            baseDelay: TimeSpan.FromMilliseconds(1));

        BackgroundWorkerResilientSqlConnectionFactory workerFactory = new(
            new SqlConnectionFactory(connectionFactory.ConnectionString),
            pipeline);
        SqlResilientOperationExecutor executor = new(pipeline);

        return new SqlItsmFindingCorrelationRepository(workerFactory, executor);
    }

    private static async Task SeedTenantAsync(
        TestSqlConnectionFactory connectionFactory,
        DapperTenantRepository tenants,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId)
    {
        await tenants.InsertTenantAsync(
            tenantId,
            "TB-390 tenant",
            "tb390-" + Guid.NewGuid().ToString("N")[..8],
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        await tenants.InsertWorkspaceAsync(
            workspaceId,
            tenantId,
            "ws",
            projectId,
            CancellationToken.None);

        DapperArchitectureProjectRepository projects = new(connectionFactory);

        await projects.InsertAsync(projectId, tenantId, workspaceId, "default", CancellationToken.None);
    }

    private static async Task SeedCommittedRunFindingAsync(
        TestSqlConnectionFactory connectionFactory,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid runId,
        Guid findingsSnapshotId,
        Guid findingRecordId,
        Guid goldenManifestId,
        string findingId,
        DateTime completedUtc,
        string humanReviewStatus)
    {
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(CancellationToken.None);

        const string insertRun = """
                                 INSERT INTO dbo.Runs
                                 (
                                     RunId, ProjectId, CreatedUtc, CompletedUtc, TenantId, WorkspaceId, ScopeProjectId,
                                     FindingsSnapshotId, GoldenManifestId, LegacyRunStatus
                                 )
                                 VALUES
                                 (
                                     @RunId, N'tb390', @CreatedUtc, @CompletedUtc, @TenantId, @WorkspaceId, @ScopeProjectId,
                                     @FindingsSnapshotId, @GoldenManifestId, N'Committed'
                                 );
                                 """;

        await connection.ExecuteAsync(
            insertRun,
            new
            {
                RunId = runId,
                CreatedUtc = completedUtc.AddMinutes(-5),
                CompletedUtc = completedUtc,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ScopeProjectId = projectId,
                FindingsSnapshotId = findingsSnapshotId,
                GoldenManifestId = goldenManifestId
            });

        const string insertFindingsSnapshot = """
                                              INSERT INTO dbo.FindingsSnapshots
                                              (
                                                  FindingsSnapshotId, RunId, ContextSnapshotId, GraphSnapshotId,
                                                  TenantId, WorkspaceId, ProjectId, CreatedUtc, SchemaVersion, FindingsJson
                                              )
                                              VALUES
                                              (
                                                  @FindingsSnapshotId, @RunId, @RunId, @RunId,
                                                  @TenantId, @WorkspaceId, @ProjectId, @CreatedUtc, 1, N'[]'
                                              );
                                              """;

        await connection.ExecuteAsync(
            insertFindingsSnapshot,
            new
            {
                FindingsSnapshotId = findingsSnapshotId,
                RunId = runId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                CreatedUtc = completedUtc.AddMinutes(-4)
            });

        await connection.ExecuteAsync(
            RelationalScopeChildInsertSql.FindingRecordFromSnapshot,
            new
            {
                FindingRecordId = findingRecordId,
                FindingsSnapshotId = findingsSnapshotId,
                SortOrder = 0,
                FindingId = findingId,
                FindingSchemaVersion = 1,
                FindingType = "test",
                Category = "test",
                EngineType = "test",
                Severity = "warning",
                Title = "TB-390 finding",
                Rationale = "test",
                PayloadType = (string?)null,
                PayloadJson = (string?)null
            });

        const string updateHumanReview = """
                                         UPDATE dbo.FindingRecords
                                         SET HumanReviewStatus = @HumanReviewStatus
                                         WHERE FindingRecordId = @FindingRecordId;
                                         """;

        await connection.ExecuteAsync(
            updateHumanReview,
            new { FindingRecordId = findingRecordId, HumanReviewStatus = humanReviewStatus });
    }

    private static async Task<string> ReadHumanReviewStatusAsync(
        TestSqlConnectionFactory connectionFactory,
        Guid findingRecordId)
    {
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(CancellationToken.None);

        return await connection.ExecuteScalarAsync<string>(
                   """
                   SELECT HumanReviewStatus
                   FROM dbo.FindingRecords
                   WHERE FindingRecordId = @FindingRecordId;
                   """,
                   new { FindingRecordId = findingRecordId })
               ?? string.Empty;
    }
}
