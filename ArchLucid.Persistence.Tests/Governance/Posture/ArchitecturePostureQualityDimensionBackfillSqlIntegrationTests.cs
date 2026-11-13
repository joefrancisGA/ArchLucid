using Dapper;

using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

using Microsoft.Data.SqlClient;

using static ArchLucid.Persistence.Tests.Support.PersistenceIntegrationTestScope;

namespace ArchLucid.Persistence.Tests.Governance.Posture;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class ArchitecturePostureQualityDimensionBackfillSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private const string CategoryMapBackfillSql = """
        UPDATE fr
        SET fr.QualityDimension = pcm.PillarKey
        FROM dbo.FindingRecords AS fr
        INNER JOIN dbo.PillarCategoryMap AS pcm
            ON pcm.SourceCategory = fr.Category
        WHERE fr.QualityDimension IS NULL
          AND pcm.PillarKey IS NOT NULL
          AND pcm.IsReviewIntegrity = 0;
        """;

    [SkippableFact]
    public async Task Migration_321_category_backfill_is_idempotent()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync();

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();
        Guid recordId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid contextSnapshotId = Guid.NewGuid();
        Guid graphSnapshotId = Guid.NewGuid();

        // Seed valid FK parents so this test isolates the category backfill.
        await AuthorityRunChainTestSeed.SeedRunAndContextOnlyAsync(
            connection, tenantId, workspaceId, projectId,
            runId, contextSnapshotId, "posture-quality-backfill", CancellationToken.None);
        await AuthorityRunChainTestSeed.InsertGraphSnapshotHeaderAsync(
            connection, tenantId, workspaceId, projectId,
            graphSnapshotId, contextSnapshotId, runId, DateTime.UtcNow,
            "[]", "[]", "[]", CancellationToken.None);

        await connection.ExecuteAsync(
            """
            INSERT INTO dbo.FindingsSnapshots (
                FindingsSnapshotId, TenantId, WorkspaceId, ProjectId, RunId,
                ContextSnapshotId, GraphSnapshotId, CreatedUtc, SchemaVersion,
                GenerationStatus, FindingsJson)
            VALUES (
                @SnapshotId, @TenantId, @WorkspaceId, @ProjectId, @RunId,
                @ContextSnapshotId, @GraphSnapshotId, SYSUTCDATETIME(), 1,
                N'Complete', N'[]');

            INSERT INTO dbo.FindingRecords (
                FindingRecordId, FindingsSnapshotId, TenantId, WorkspaceId, ProjectId,
                SortOrder, FindingId, FindingSchemaVersion, FindingType, Category,
                EngineType, Severity, Title, Rationale)
            VALUES (
                @RecordId, @SnapshotId, @TenantId, @WorkspaceId, @ProjectId,
                0, N'test-finding', 1, N'Test', N'Security',
                N'security-gap', N'Warning', N'Title', N'Rationale');
            """,
            new
            {
                SnapshotId = snapshotId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                RunId = runId,
                ContextSnapshotId = contextSnapshotId,
                GraphSnapshotId = graphSnapshotId,
                RecordId = recordId,
            });

        int firstPassRows = await connection.ExecuteAsync(CategoryMapBackfillSql);
        firstPassRows.Should().Be(1);

        string? qualityDimension = await connection.QuerySingleOrDefaultAsync<string?>(
            """
            SELECT QualityDimension
            FROM dbo.FindingRecords
            WHERE FindingRecordId = @RecordId;
            """,
            new { RecordId = recordId });

        qualityDimension.Should().Be("Security");

        int secondPassRows = await connection.ExecuteAsync(CategoryMapBackfillSql);
        secondPassRows.Should().Be(0);
    }
}
