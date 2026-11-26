using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Tests.Support;

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
    public async Task ListAsync_does_not_apply_foreign_workspace_ticket_to_in_scope_register_row()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid foreignWorkspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        const string sharedFindingId = "finding-shared-ticket-id";
        string foreignTicket = $"FOREIGN-{tenantId:N}";
        string inScopeTicket = $"IN-SCOPE-{tenantId:N}";

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid snapshotId = Guid.NewGuid();
        Guid findingRecordId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid contextSnapshotId = Guid.NewGuid();
        Guid graphSnapshotId = Guid.NewGuid();

        await AuthorityRunChainTestSeed.SeedRunAndContextOnlyAsync(
            connection, tenantId, workspaceId, projectId,
            runId, contextSnapshotId, "risk-register-ticket-scope", CancellationToken.None);
        await AuthorityRunChainTestSeed.InsertGraphSnapshotHeaderAsync(
            connection, tenantId, workspaceId, projectId,
            graphSnapshotId, contextSnapshotId, runId, DateTime.UtcNow,
            "[]", "[]", "[]", CancellationToken.None);

        await connection.ExecuteAsync(
            """
            INSERT INTO dbo.Tenants (Id, Name, Slug, Tier)
            VALUES (@TenantId, N'Risk register ticket scope test', @TenantSlug, N'Standard');

            INSERT INTO dbo.FindingsSnapshots (
                FindingsSnapshotId, TenantId, WorkspaceId, ProjectId, RunId,
                ContextSnapshotId, GraphSnapshotId, CreatedUtc, SchemaVersion,
                GenerationStatus, FindingsJson)
            VALUES
                (@SnapshotId, @TenantId, @WorkspaceId, @ProjectId, @RunId,
                 @ContextSnapshotId, @GraphSnapshotId, SYSUTCDATETIME(), 1,
                 N'Complete', N'[]');

            INSERT INTO dbo.FindingRecords (
                FindingRecordId, FindingsSnapshotId, TenantId, WorkspaceId, ProjectId,
                SortOrder, FindingId, FindingSchemaVersion, FindingType, Category, QualityDimension,
                EngineType, Severity, Title, Rationale, IsMuted)
            VALUES
                (@FindingRecordId, @SnapshotId, @TenantId, @WorkspaceId, @ProjectId,
                 0, @SharedFindingId, 1, N'Test', N'Security', N'Security',
                 N'test', N'Critical', N'Open in scope', N'Because', 0);

            INSERT INTO dbo.ItsmFindingCorrelations (
                TenantId, WorkspaceId, ProjectId, FindingId, Provider, ExternalKey)
            VALUES
                (@TenantId, @ForeignWorkspaceId, @ProjectId, @SharedFindingId, N'Jira', @ForeignTicket);
            """,
            new
            {
                TenantId = tenantId,
                TenantSlug = $"risk-register-{tenantId:N}",
                WorkspaceId = workspaceId,
                ForeignWorkspaceId = foreignWorkspaceId,
                ProjectId = projectId,
                SnapshotId = snapshotId,
                FindingRecordId = findingRecordId,
                SharedFindingId = sharedFindingId,
                ForeignTicket = foreignTicket,
                RunId = runId,
                ContextSnapshotId = contextSnapshotId,
                GraphSnapshotId = graphSnapshotId,
            });

        ArchitectureRiskRegisterReader registerReader = new(factory);

        async Task<ArchitectureRiskRegisterEntry> ReadFindingAsync()
        {
            IReadOnlyList<ArchitectureRiskRegisterEntry> rows = await registerReader.ListAsync(
                tenantId, workspaceId, projectId, maxRows: 10, cancellationToken: CancellationToken.None);

            return rows.Should().ContainSingle(e => e.FindingId == sharedFindingId).Subject;
        }

        (await ReadFindingAsync()).ItsmLinkedTicketsSummary.Should().BeNull(
            "register rows must not inherit a sibling-workspace ticket for the same finding id");

        await connection.ExecuteAsync(new CommandDefinition(
            """
            INSERT INTO dbo.ItsmFindingCorrelations (
                TenantId, WorkspaceId, ProjectId, FindingId, Provider, ExternalKey)
            VALUES
                (@TenantId, @WorkspaceId, @ProjectId, @FindingId, N'Jira', @Ticket);
            """,
            new { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId, FindingId = sharedFindingId, Ticket = inScopeTicket },
            cancellationToken: CancellationToken.None));

        (await ReadFindingAsync()).ItsmLinkedTicketsSummary.Should().Be($"Jira:{inScopeTicket}",
            "only the in-scope ticket may link to the register row");
    }

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
        Guid contextSnapshotId = Guid.NewGuid();
        Guid graphSnapshotId = Guid.NewGuid();

        // FindingsSnapshots has foreign keys to the run/context/graph chain.
        // Seed the parents before exercising project-scoped disposition isolation.
        await AuthorityRunChainTestSeed.SeedRunAndContextOnlyAsync(
            connection, tenantId, workspaceId, inScopeProjectId,
            runId, contextSnapshotId, "risk-register-disposition-scope", CancellationToken.None);
        await AuthorityRunChainTestSeed.InsertGraphSnapshotHeaderAsync(
            connection, tenantId, workspaceId, inScopeProjectId,
            graphSnapshotId, contextSnapshotId, runId, DateTime.UtcNow,
            "[]", "[]", "[]", CancellationToken.None);

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
                ContextSnapshotId = contextSnapshotId,
                GraphSnapshotId = graphSnapshotId,
            });

        ArchitectureRiskRegisterReader registerReader = new(factory);

        IReadOnlyList<ArchitectureRiskRegisterEntry> rows = await registerReader.ListAsync(
            tenantId,
            workspaceId,
            inScopeProjectId,
            maxRows: 10,
            cancellationToken: CancellationToken.None);

        ArchitectureRiskRegisterEntry row = rows.Should().ContainSingle(e => e.FindingId == sharedFindingId).Subject;
        row.LatestDisposition.Should().BeNull(
            "register rows must not inherit sibling-project remediated dispositions for the same finding id");
    }
}
