using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Governance;

using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;

using static ArchLucid.Persistence.Tests.Support.PersistenceIntegrationTestScope;

namespace ArchLucid.Persistence.Tests.Governance;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class ArchitectureRiskRegisterReaderDispositionScopeSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task ListAsync_does_not_apply_foreign_project_disposition_to_in_scope_register_row()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid inScopeProjectId = Guid.NewGuid();
        Guid foreignProjectId = Guid.NewGuid();
        const string sharedFindingId = "finding-shared-id";

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid inScopeSnapshotId = Guid.NewGuid();
        Guid inScopeRecordId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();

        await connection.ExecuteAsync(
            """
            INSERT INTO dbo.FindingsSnapshots (
                FindingsSnapshotId, TenantId, WorkspaceId, ProjectId, RunId,
                ContextSnapshotId, GraphSnapshotId, CreatedUtc, SchemaVersion,
                GenerationStatus, FindingsJson)
            VALUES
                (@InScopeSnapshotId, @TenantId, @WorkspaceId, @InScopeProjectId, @RunId,
                 @ContextSnapshotId, @GraphSnapshotId, SYSUTCDATETIME(), 1,
                 N'Complete', N'[]');

            INSERT INTO dbo.FindingRecords (
                FindingRecordId, FindingsSnapshotId, TenantId, WorkspaceId, ProjectId,
                SortOrder, FindingId, FindingSchemaVersion, FindingType, Category, QualityDimension,
                EngineType, Severity, Title, Rationale, IsMuted)
            VALUES
                (@InScopeRecordId, @InScopeSnapshotId, @TenantId, @WorkspaceId, @InScopeProjectId,
                 0, @SharedFindingId, 1, N'Test', N'Security', N'Security',
                 N'test', N'Critical', N'Open in scope', N'Because', 0);

            INSERT INTO dbo.FindingReviewEvents (
                EventId, TenantId, WorkspaceId, ProjectId, FindingId, ReviewerUserId,
                Action, OccurredAtUtc, Disposition)
            VALUES
                (NEWID(), @TenantId, @WorkspaceId, @ForeignProjectId, @SharedFindingId, N'reviewer-1',
                 N'Disposition', SYSUTCDATETIME(), N'Remediated');
            """,
            new
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                InScopeProjectId = inScopeProjectId,
                ForeignProjectId = foreignProjectId,
                InScopeSnapshotId = inScopeSnapshotId,
                InScopeRecordId = inScopeRecordId,
                SharedFindingId = sharedFindingId,
                RunId = runId,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
            });

        ArchitectureRiskRegisterReader registerReader = new(factory);

        IReadOnlyList<ArchitectureRiskRegisterEntry> rows = await registerReader.ListAsync(
            tenantId,
            workspaceId,
            inScopeProjectId,
            maxRows: 10,
            cancellationToken: CancellationToken.None);

        ArchitectureRiskRegisterEntry row = rows.Should().ContainSingle(e => e.FindingId == sharedFindingId).Subject;
        row.Disposition.Should().BeNull(
            "register rows must not inherit sibling-project remediated dispositions for the same finding id");
    }
}
