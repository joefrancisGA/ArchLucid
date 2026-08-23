using ArchLucid.Contracts.Governance.Posture;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Governance.Posture;

using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;

using static ArchLucid.Persistence.Tests.Support.PersistenceIntegrationTestScope;

namespace ArchLucid.Persistence.Tests.Governance.Posture;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlArchitecturePostureReaderSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task ReadAsync_aggregates_latest_snapshot_only_and_excludes_other_tenants()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid otherTenantId = Guid.NewGuid();

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid olderSnapshotId = Guid.NewGuid();
        Guid latestSnapshotId = Guid.NewGuid();
        Guid olderRecordId = Guid.NewGuid();
        Guid securityRecordId = Guid.NewGuid();
        Guid topologyRecordId = Guid.NewGuid();
        Guid uncategorizedRecordId = Guid.NewGuid();
        Guid otherTenantRecordId = Guid.NewGuid();
        string securityFindingId = "posture-security-finding";
        string topologyFindingId = "posture-topology-finding";

        await connection.ExecuteAsync(
            """
            INSERT INTO dbo.FindingsSnapshots (
                FindingsSnapshotId, TenantId, WorkspaceId, ProjectId, RunId,
                ContextSnapshotId, GraphSnapshotId, CreatedUtc, SchemaVersion,
                GenerationStatus, FindingsJson)
            VALUES
                (@OlderSnapshotId, @TenantId, @WorkspaceId, @ProjectId, @RunId,
                 @ContextSnapshotId, @GraphSnapshotId, DATEADD(MINUTE, -5, SYSUTCDATETIME()), 1,
                 N'Complete', N'[]'),
                (@LatestSnapshotId, @TenantId, @WorkspaceId, @ProjectId, @RunId,
                 @ContextSnapshotId, @GraphSnapshotId, SYSUTCDATETIME(), 1,
                 N'Complete', N'[]');

            INSERT INTO dbo.FindingRecords (
                FindingRecordId, FindingsSnapshotId, TenantId, WorkspaceId, ProjectId,
                SortOrder, FindingId, FindingSchemaVersion, FindingType, Category, QualityDimension,
                EngineType, Severity, Title, Rationale, IsMuted)
            VALUES
                (@OlderRecordId, @OlderSnapshotId, @TenantId, @WorkspaceId, @ProjectId,
                 0, N'stale-finding', 1, N'Test', N'Security', N'Security',
                 N'test', N'Warning', N'Stale', N'Stale', 0),
                (@SecurityRecordId, @LatestSnapshotId, @TenantId, @WorkspaceId, @ProjectId,
                 0, @SecurityFindingId, 1, N'Test', N'Security', N'Security',
                 N'test', N'Error', N'Security gap', N'Because', 0),
                (@TopologyRecordId, @LatestSnapshotId, @TenantId, @WorkspaceId, @ProjectId,
                 1, @TopologyFindingId, 1, N'Test', N'Topology', NULL,
                 N'test', N'Warning', N'Topology gap', N'Because', 1),
                (@UncategorizedRecordId, @LatestSnapshotId, @TenantId, @WorkspaceId, @ProjectId,
                 2, N'uncategorized-finding', 1, N'Test', N'UnknownCategory', NULL,
                 N'test', N'Info', N'Unknown', N'Because', 0),
                (@OtherTenantRecordId, @LatestSnapshotId, @OtherTenantId, @WorkspaceId, @ProjectId,
                 3, N'other-tenant-finding', 1, N'Test', N'Security', N'Security',
                 N'test', N'Critical', N'Other tenant', N'Because', 0);

            INSERT INTO dbo.FindingReviewEvents (
                EventId, TenantId, WorkspaceId, ProjectId, FindingId, ReviewerUserId,
                Action, OccurredAtUtc, Disposition)
            VALUES
                (NEWID(), @TenantId, @WorkspaceId, @ProjectId, @SecurityFindingId, N'reviewer-1',
                 N'Disposition', DATEADD(MINUTE, -10, SYSUTCDATETIME()), N'Accepted'),
                (NEWID(), @TenantId, @WorkspaceId, @ProjectId, @SecurityFindingId, N'reviewer-1',
                 N'Disposition', SYSUTCDATETIME(), N'Remediated');
            """,
            new
            {
                TenantId = tenantId,
                OtherTenantId = otherTenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                RunId = Guid.NewGuid(),
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                OlderSnapshotId = olderSnapshotId,
                LatestSnapshotId = latestSnapshotId,
                OlderRecordId = olderRecordId,
                SecurityRecordId = securityRecordId,
                TopologyRecordId = topologyRecordId,
                UncategorizedRecordId = uncategorizedRecordId,
                OtherTenantRecordId = otherTenantRecordId,
                SecurityFindingId = securityFindingId,
                TopologyFindingId = topologyFindingId,
            });

        SqlArchitecturePostureReader reader = new(factory);

        ArchitecturePostureReadModel model = await reader.ReadAsync(
            tenantId,
            workspaceId,
            projectId,
            CancellationToken.None);

        PillarFindingAggregate securityAggregate = model.PillarAggregates.Should().ContainSingle().Subject;
        securityAggregate.PillarKey.Should().Be("Security");
        securityAggregate.ErrorCount.Should().Be(1);
        securityAggregate.DispositionedCount.Should().Be(1);

        model.ReviewIntegrity.WarningCount.Should().Be(1);
        model.ReviewIntegrity.MutedCount.Should().Be(1);
        model.UncategorizedCount.Should().Be(1);
        model.PackAssignments.Should().BeEmpty();
    }
}
