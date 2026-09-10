using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Serialization;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Findings;

/// <summary>
///     ADR 0076 — inspect read must surface current disposition pointer fields for optimistic concurrency.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class FindingInspectDispositionAdr0076SqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private const string FindingId = "finding-disposition-inspect";

    private static readonly Guid TenantId = Guid.Parse("d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1");
    private static readonly Guid WorkspaceId = Guid.Parse("e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2");
    private static readonly Guid ProjectId = Guid.Parse("f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3");

    [SkippableFact]
    public async Task GetInspectAsync_surfaces_current_disposition_pointer_fields_from_FindingCurrentDispositions()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        ScopeContext scope = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

        Guid runId = await SeedFindingAsync(fixture.ConnectionString, scope);

        Guid eventId = Guid.NewGuid();
        const string reviewerUserId = "reviewer@contoso.com";
        DateTimeOffset occurredAtUtc = new(2026, 9, 7, 12, 0, 0, TimeSpan.Zero);
        DateTimeOffset revisitDueUtc = new(2026, 10, 1, 0, 0, 0, TimeSpan.Zero);

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlFindingDispositionConcurrencyRepository dispositionRepository = new(factory);

        FindingDispositionRecordResult recordResult = await dispositionRepository.RecordAsync(
            new FindingReviewEventRecord
            {
                EventId = eventId,
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                FindingId = FindingId,
                ReviewerUserId = reviewerUserId,
                Action = FindingReviewAction.RecordDisposition,
                Disposition = FindingDisposition.Deferred,
                OccurredAtUtc = occurredAtUtc,
                RevisitDueUtc = revisitDueUtc,
                RunId = runId,
            },
            expectedCurrentRowVersion: null,
            CancellationToken.None);

        recordResult.Status.Should().Be(FindingDispositionRecordStatus.Recorded);
        recordResult.NewCurrentRowVersion.Should().NotBeNullOrEmpty();

        string expectedRowVersionBase64 = Convert.ToBase64String(recordResult.NewCurrentRowVersion!);

        DapperFindingInspectReadRepository inspectReader = new(factory);

        FindingInspectResponse? response = await inspectReader.GetInspectAsync(
            scope,
            FindingId,
            CancellationToken.None);

        response.Should().NotBeNull();
        response!.LatestDisposition.Should().Be(FindingDisposition.Deferred);
        response.LatestDispositionOccurredAtUtc.Should().Be(occurredAtUtc);
        response.LatestDispositionEventId.Should().Be(eventId);
        response.LatestDispositionReviewerUserId.Should().Be(reviewerUserId);
        response.LatestDispositionRowVersionBase64.Should().Be(expectedRowVersionBase64);
        response.RevisitDueUtc.Should().Be(revisitDueUtc);
    }

    private static async Task<Guid> SeedFindingAsync(string connectionString, ScopeContext scope)
    {
        SqlConnectionFactory factory = new(connectionString);
        await using Microsoft.Data.SqlClient.SqlConnection connection =
            await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();

        await AuthorityRunChainTestSeed.SeedRunAndContextOnlyAsync(
            connection,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            runId,
            contextId,
            "finding-inspect-disposition-adr0076",
            CancellationToken.None);

        string emptyNodes = JsonEntitySerializer.Serialize(new List<GraphNode>());
        string emptyEdges = JsonEntitySerializer.Serialize(new List<GraphEdge>());
        string emptyGraphWarnings = JsonEntitySerializer.Serialize(new List<string>());

        await AuthorityRunChainTestSeed.InsertGraphSnapshotHeaderAsync(
            connection,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            graphId,
            contextId,
            runId,
            TimeProvider.System.UtcNowDateTime(),
            emptyNodes,
            emptyEdges,
            emptyGraphWarnings,
            CancellationToken.None);

        FixedTestScopeContextProvider scopeProvider = new(scope);
        SqlFindingsSnapshotRepository findingsRepository = new(
            factory,
            new TestReadOnlyDbConnectionFactory(factory),
            scopeProvider);

        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = findingsId,
            RunId = runId,
            ContextSnapshotId = contextId,
            GraphSnapshotId = graphId,
            CreatedUtc = new DateTime(2026, 9, 7, 12, 0, 0, DateTimeKind.Utc),
            SchemaVersion = FindingsSchema.CurrentSnapshotVersion,
            Findings =
            [
                new Finding
                {
                    FindingId = FindingId,
                    FindingType = "RequirementFinding",
                    Category = "Security",
                    EngineType = "TestEngine",
                    Severity = FindingSeverity.Warning,
                    Title = "Disposition inspect probe",
                    Rationale = "Inspect must join FindingCurrentDispositions for ADR 0076 CAS fields.",
                },
            ],
        };

        FindingsSnapshotMigrator.Apply(snapshot);
        await findingsRepository.SaveAsync(snapshot, CancellationToken.None);

        return runId;
    }
}
