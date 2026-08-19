using ArchLucid.ContextIngestion.Models;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Coordination.Backfill;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Serialization;

using Dapper;

using Microsoft.Data.SqlClient;
using ArchLucid.KnowledgeGraph.Caching;

using Microsoft.Extensions.Logging.Abstractions;

using static ArchLucid.Persistence.Tests.Support.PersistenceIntegrationTestScope;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     <see cref="SqlRelationalBackfillService" /> against SQL Server + DbUp.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlRelationalBackfillServiceSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    [SkippableFact]
    public async Task RunAsync_populates_context_relational_from_json_and_second_run_is_noop()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid runId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();
        DateTime createdUtc = await NextContextSnapshotBackfillCreatedUtcAsync(connection, CancellationToken.None);

        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                INSERT INTO dbo.Runs (RunId, ProjectId, CreatedUtc, TenantId, WorkspaceId, ScopeProjectId)
                VALUES (@RunId, @ProjectId, @CreatedUtc, @TenantId, @WorkspaceId, @ScopeProjectId);
                """,
                new
                {
                    RunId = runId,
                    ProjectId = "proj-bf",
                    CreatedUtc = createdUtc,
                    TenantId,
                    WorkspaceId,
                    ScopeProjectId = ProjectId
                },
                cancellationToken: CancellationToken.None));

        List<CanonicalObject> objects =
        [
            new()
            {
                ObjectId = "o1",
                ObjectType = "Service",
                Name = "api",
                SourceType = "repo",
                SourceId = "src",
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["k"] = "v" }
            }
        ];

        string canonicalJson = JsonEntitySerializer.Serialize(objects);
        string emptyList = JsonEntitySerializer.Serialize(new List<string>());
        string emptyDict = JsonEntitySerializer.Serialize(new Dictionary<string, string>());

        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                INSERT INTO dbo.ContextSnapshots
                (
                    SnapshotId, RunId, ProjectId, TenantId, WorkspaceId, ScopeProjectId, CreatedUtc,
                    CanonicalObjectsJson, DeltaSummary, WarningsJson, ErrorsJson, SourceHashesJson
                )
                VALUES
                (
                    @SnapshotId, @RunId, @ProjectId, @TenantId, @WorkspaceId, @ScopeProjectId, @CreatedUtc,
                    @CanonicalObjectsJson, @DeltaSummary, @WarningsJson, @ErrorsJson, @SourceHashesJson
                );
                """,
                new
                {
                    SnapshotId = snapshotId,
                    RunId = runId,
                    ProjectId = "proj-bf",
                    TenantId,
                    WorkspaceId,
                    ScopeProjectId = ProjectId,
                    CreatedUtc = createdUtc,
                    CanonicalObjectsJson = canonicalJson,
                    DeltaSummary = (string?)null,
                    WarningsJson = emptyList,
                    ErrorsJson = emptyList,
                    SourceHashesJson = emptyDict
                },
                cancellationToken: CancellationToken.None));

        int before = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                "SELECT COUNT(1) FROM dbo.ContextSnapshotCanonicalObjects WHERE SnapshotId = @SnapshotId;",
                new { SnapshotId = snapshotId },
                cancellationToken: CancellationToken.None));

        before.Should().Be(0);

        SqlRelationalBackfillService backfill = CreateService(factory);

        SqlRelationalBackfillReport report1 = await backfill.RunAsync(
            new SqlRelationalBackfillOptions
            {
                ContextSnapshots = true,
                GraphSnapshots = false,
                FindingsSnapshots = false,
                GoldenManifestsPhase1 = false,
                ArtifactBundles = false
            },
            CancellationToken.None);

        report1.FailureCount.Should().Be(0);

        SqlRelationalBackfillStageTiming contextStage =
            report1.StageTimings.Should().ContainSingle(t => t.Stage == "ContextSnapshots").Subject;

        // Shared ArchLucidPersistenceTests catalog may already contain JSON-only snapshots from earlier
        // collection tests; the backfill cursor advances globally — assert our row hydrated, not an exact batch size.
        contextStage.ProcessedCount.Should().BeGreaterThan(0);
        contextStage.FailureCount.Should().Be(0);

        int afterFirst = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                "SELECT COUNT(1) FROM dbo.ContextSnapshotCanonicalObjects WHERE SnapshotId = @SnapshotId;",
                new { SnapshotId = snapshotId },
                cancellationToken: CancellationToken.None));

        afterFirst.Should().BeGreaterThan(0);

        SqlRelationalBackfillReport report2 = await backfill.RunAsync(
            new SqlRelationalBackfillOptions
            {
                ContextSnapshots = true,
                GraphSnapshots = false,
                FindingsSnapshots = false,
                GoldenManifestsPhase1 = false,
                ArtifactBundles = false
            },
            CancellationToken.None);

        report2.FailureCount.Should().Be(0);

        int afterSecond = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                "SELECT COUNT(1) FROM dbo.ContextSnapshotCanonicalObjects WHERE SnapshotId = @SnapshotId;",
                new { SnapshotId = snapshotId },
                cancellationToken: CancellationToken.None));

        afterSecond.Should().Be(afterFirst);
    }

    [SkippableFact]
    public async Task RunAsync_skips_quarantined_entity_when_max_retries_exceeded()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid runId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();

        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                INSERT INTO dbo.Runs (RunId, ProjectId, CreatedUtc, TenantId, WorkspaceId, ScopeProjectId)
                VALUES (@RunId, @ProjectId, @CreatedUtc, @TenantId, @WorkspaceId, @ScopeProjectId);

                INSERT INTO dbo.ContextSnapshots
                (
                    SnapshotId, RunId, ProjectId, TenantId, WorkspaceId, ScopeProjectId, CreatedUtc,
                    CanonicalObjectsJson, DeltaSummary, WarningsJson, ErrorsJson, SourceHashesJson
                )
                VALUES
                (
                    @SnapshotId, @RunId, @ProjectId, @TenantId, @WorkspaceId, @ScopeProjectId, @CreatedUtc,
                    N'not-valid-json', @DeltaSummary, N'[]', N'[]', N'{}'
                );
                """,
                new
                {
                    RunId = runId,
                    ProjectId = "proj-quarantine",
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    TenantId,
                    WorkspaceId,
                    ScopeProjectId = ProjectId,
                    SnapshotId = snapshotId,
                    DeltaSummary = (string?)null,
                },
                cancellationToken: CancellationToken.None));

        SqlRelationalBackfillService backfill = CreateService(factory);
        SqlRelationalBackfillOptions options = new()
        {
            ContextSnapshots = true,
            GraphSnapshots = false,
            FindingsSnapshots = false,
            GoldenManifestsPhase1 = false,
            ArtifactBundles = false,
            BatchSize = 10,
            MaxRetries = 1,
        };

        SqlRelationalBackfillReport first = await backfill.RunAsync(options, CancellationToken.None);
        first.FailureCount.Should().BeGreaterThan(0);

        SqlRelationalBackfillReport second = await backfill.RunAsync(options, CancellationToken.None);
        second.SkippedQuarantinedCount.Should().Be(1);
        second.FailureCount.Should().Be(0);
    }

    /// <summary>
    ///     Returns a <c>CreatedUtc</c> strictly after the persisted backfill cursor and any existing snapshot rows so
    ///     keyset paging cannot skip a freshly inserted test row on a reused CI catalog.
    /// </summary>
    private static async Task<DateTime> NextContextSnapshotBackfillCreatedUtcAsync(
        SqlConnection connection,
        CancellationToken cancellationToken)
    {
        DateTime baseline = SqlRelationalBackfillCursor.Start.LastProcessedCreatedUtc;

        DateTime? maxRowUtc = await connection.ExecuteScalarAsync<DateTime?>(
            new CommandDefinition(
                "SELECT MAX(CreatedUtc) FROM dbo.ContextSnapshots;",
                cancellationToken: cancellationToken));

        if (maxRowUtc is { } rowMax && rowMax > baseline)
            baseline = rowMax;

        DateTime? checkpointUtc = await connection.ExecuteScalarAsync<DateTime?>(
            new CommandDefinition(
                """
                SELECT LastProcessedCreatedUtc
                FROM dbo.BackfillCheckpoints
                WHERE Stage = @Stage;
                """,
                new { Stage = "ContextSnapshots" },
                cancellationToken: cancellationToken));

        if (checkpointUtc is { } cp && cp > baseline)
            baseline = cp;

        return baseline.AddSeconds(1);
    }

    private static SqlRelationalBackfillService CreateService(SqlConnectionFactory factory)
    {
        return new SqlRelationalBackfillService(
            factory,
            new SqlContextSnapshotRepository(factory, Empty),
            new SqlGraphSnapshotRepository(factory, Empty),
            new SqlFindingsSnapshotRepository(
                factory,
                new TestReadOnlyDbConnectionFactory(factory),
                Empty),
            SqlPersistenceRepositoryFactory.CreateGoldenManifestRepository(factory),
            SqlPersistenceRepositoryFactory.CreateArtifactBundleRepository(factory),
            NonCachingGraphSnapshotProjectionCache.Instance,
            NullLogger<SqlRelationalBackfillService>.Instance);
    }
}
