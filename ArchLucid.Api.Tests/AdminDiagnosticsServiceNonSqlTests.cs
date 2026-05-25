using System.Globalization;
using System.Text.Json;

using ArchLucid.Api.Services.Admin;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>Unit tests for <see cref="AdminDiagnosticsService" /> paths that use only Moq collaborators (no SQL).</summary>
[Trait("Suite", "Core")]
public sealed class AdminDiagnosticsServiceNonSqlTests
{
    [Fact]
    public async Task GetCacheDiagnosticsAsync_returns_snapshot_from_provider()
    {
        Mock<IAuditService> audit = new();
        Mock<IActorContext> actor = ActorMock();
        Mock<IDbConnectionFactory> factory = new(MockBehavior.Strict);
        Mock<ICacheTelemetrySnapshotProvider> cacheTelemetry = new();

        CacheTelemetrySnapshot snapshot = new()
        {
            HotPathReadCacheHits = 11,
            HotPathReadCacheMisses = 4,
            ExplanationCacheHits = 6,
            ExplanationCacheMisses = 2,
            LlmCompletionCacheHits = 30,
            LlmCompletionCacheMisses = 5,
            GraphProjectionCacheHits = 7,
            GraphProjectionCacheMisses = 1,
            GraphProjectionCacheEnabled = false,
        };

        _ = cacheTelemetry.Setup(c => c.GetSnapshot()).Returns(snapshot);

        AdminDiagnosticsService sut = CreateDiagnosticsService(
            factory,
            SqlOptions(),
            audit,
            actor,
            cacheTelemetry.Object,
            out _,
            out _,
            out _,
            out _,
            out _);

        AdminCacheDiagnosticsResponse response = await sut.GetCacheDiagnosticsAsync(CancellationToken.None);

        Assert.Equal(snapshot.HotPathReadCacheHits, response.HotPathReadCacheHits);
        Assert.Equal(snapshot.HotPathReadCacheMisses, response.HotPathReadCacheMisses);
        Assert.Equal(snapshot.ExplanationCacheHits, response.ExplanationCacheHits);
        Assert.Equal(snapshot.ExplanationCacheMisses, response.ExplanationCacheMisses);
        Assert.Equal(snapshot.LlmCompletionCacheHits, response.LlmCompletionCacheHits);
        Assert.Equal(snapshot.LlmCompletionCacheMisses, response.LlmCompletionCacheMisses);
        Assert.Equal(snapshot.GraphProjectionCacheHits, response.GraphProjectionCacheHits);
        Assert.Equal(snapshot.GraphProjectionCacheMisses, response.GraphProjectionCacheMisses);
        Assert.Equal(snapshot.GraphProjectionCacheEnabled, response.GraphProjectionCacheEnabled);
    }

    [Fact]
    public async Task GetOutboxSnapshotAsync_aggregates_repository_counts()
    {
        Mock<IAuditService> audit = new();
        Mock<IActorContext> actor = ActorMock();
        Mock<IDbConnectionFactory> factory = new(MockBehavior.Strict);

        AdminDiagnosticsService sut = CreateDiagnosticsService(
            factory,
            SqlOptions(),
            audit,
            actor,
            out Mock<IAuthorityPipelineWorkRepository> authority,
            out Mock<IRetrievalIndexingOutboxRepository> retrieval,
            out Mock<IIntegrationEventOutboxRepository> integration,
            out _,
            out _);

        _ = authority.Setup(a => a.CountActionablePendingAsync(It.IsAny<CancellationToken>())).ReturnsAsync(4);
        _ = authority.Setup(a => a.CountDeadLetteredAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _ = retrieval.Setup(r => r.CountPendingAsync(It.IsAny<CancellationToken>())).ReturnsAsync(2);

        _ = integration.Setup(i => i.CountIntegrationOutboxPublishPendingAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(8);

        _ = integration.Setup(i => i.CountIntegrationOutboxDeadLetterAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(3);

        AdminOutboxSnapshot snap = await sut.GetOutboxSnapshotAsync(CancellationToken.None);

        Assert.Equal(4, snap.AuthorityPipelineWorkPending);
        Assert.Equal(1, snap.AuthorityPipelineWorkDeadLetter);
        Assert.Equal(2, snap.RetrievalIndexingPending);
        Assert.Equal(8, snap.IntegrationEventOutboxPublishPending);
        Assert.Equal(3, snap.IntegrationEventOutboxDeadLetter);
    }

    [Fact]
    public async Task GetDataConsistencyOrphanCountsAsync_InMemory_returns_zeros_without_database()
    {
        Mock<IAuditService> audit = new();
        Mock<IActorContext> actor = ActorMock();
        Mock<IDbConnectionFactory> factory = new(MockBehavior.Strict);

        AdminDiagnosticsService sut =
            CreateDiagnosticsService(
                factory,
                InMemoryOptions(),
                audit,
                actor,
                out _,
                out _,
                out _,
                out _,
                out _);

        DataConsistencyOrphanCounts counts =
            await sut.GetDataConsistencyOrphanCountsAsync(CancellationToken.None);

        Assert.Equal(new DataConsistencyOrphanCounts(0, 0, 0, 0, 0, 0), counts);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task RemediateOrphanComparisonRecordsAsync_InMemory_short_circuits(bool dryRun)
    {
        Mock<IAuditService> audit = new();
        Mock<IActorContext> actor = ActorMock();
        Mock<IDbConnectionFactory> factory = new(MockBehavior.Strict);

        AdminDiagnosticsService sut =
            CreateDiagnosticsService(
                factory,
                InMemoryOptions(),
                audit,
                actor,
                out _,
                out _,
                out _,
                out _,
                out _);

        OrphanComparisonRemediationResult result =
            await sut.RemediateOrphanComparisonRecordsAsync(dryRun, 99, CancellationToken.None);

        Assert.Equal(dryRun, result.DryRun);
        Assert.Equal(0, result.RowCount);
        Assert.Empty(result.ComparisonRecordIds);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task RemediateOrphanGoldenManifestsAsync_InMemory_short_circuits(bool dryRun)
    {
        Mock<IAuditService> audit = new();
        Mock<IActorContext> actor = ActorMock();
        Mock<IDbConnectionFactory> factory = new(MockBehavior.Strict);

        AdminDiagnosticsService sut =
            CreateDiagnosticsService(
                factory,
                InMemoryOptions(),
                audit,
                actor,
                out _,
                out _,
                out _,
                out _,
                out _);

        OrphanGoldenManifestRemediationResult result =
            await sut.RemediateOrphanGoldenManifestsAsync(dryRun, 50, CancellationToken.None);

        Assert.Equal(dryRun, result.DryRun);
        Assert.Equal(0, result.RowCount);
        Assert.Empty(result.ManifestIds);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task RemediateOrphanFindingsSnapshotsAsync_InMemory_short_circuits(bool dryRun)
    {
        Mock<IAuditService> audit = new();
        Mock<IActorContext> actor = ActorMock();
        Mock<IDbConnectionFactory> factory = new(MockBehavior.Strict);

        AdminDiagnosticsService sut =
            CreateDiagnosticsService(
                factory,
                InMemoryOptions(),
                audit,
                actor,
                out _,
                out _,
                out _,
                out _,
                out _);

        OrphanFindingsSnapshotRemediationResult result =
            await sut.RemediateOrphanFindingsSnapshotsAsync(dryRun, 10, CancellationToken.None);

        Assert.Equal(dryRun, result.DryRun);
        Assert.Equal(0, result.RowCount);
        Assert.Empty(result.FindingsSnapshotIds);
    }

    [Fact]
    public async Task ArchiveRunsCreatedBeforeAsync_when_no_rows_skips_audit()
    {
        Mock<IAuditService> audit = new();
        Mock<IActorContext> actor = ActorMock();
        Mock<IDbConnectionFactory> factory = new(MockBehavior.Strict);

        AdminDiagnosticsService sut = CreateDiagnosticsService(
            factory,
            SqlOptions(),
            audit,
            actor,
            out _,
            out _,
            out _,
            out _,
            out Mock<IRunRepository> runs);

        DateTimeOffset cutoff = DateTimeOffset.Parse("2024-06-01T00:00:00Z", CultureInfo.InvariantCulture);

        RunArchiveBatchResult batch = new()
        {
            UpdatedCount = 0,
            ArchivedRuns = [],
            ChildCascade = new RunArchiveChildCascadeCounts()
        };

        _ = runs.Setup(r => r.ArchiveRunsCreatedBeforeAsync(cutoff, It.IsAny<CancellationToken>())).ReturnsAsync(batch);

        _ = await sut.ArchiveRunsCreatedBeforeAsync(cutoff, CancellationToken.None);

        audit.Verify(
            service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ArchiveRunsCreatedBeforeAsync_when_updated_logs_manifest_archived()
    {
        Mock<IAuditService> audit = new();
        Mock<IActorContext> actor = ActorMock();
        Mock<IDbConnectionFactory> factory = new(MockBehavior.Strict);

        AdminDiagnosticsService sut = CreateDiagnosticsService(
            factory,
            SqlOptions(),
            audit,
            actor,
            out _,
            out _,
            out _,
            out _,
            out Mock<IRunRepository> runs);

        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid workspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid projectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        RunArchiveBatchResult batch = new()
        {
            UpdatedCount = 1,
            ArchivedRuns =
            [
                new ArchivedRunScopeRow
                {
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = projectId
                }
            ],
            ChildCascade = new RunArchiveChildCascadeCounts()
        };

        DateTimeOffset cutoff = DateTimeOffset.Parse("2023-01-05T12:00:00Z", CultureInfo.InvariantCulture);
        _ = runs.Setup(r => r.ArchiveRunsCreatedBeforeAsync(cutoff, It.IsAny<CancellationToken>())).ReturnsAsync(batch);

        _ = await sut.ArchiveRunsCreatedBeforeAsync(cutoff, CancellationToken.None);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.ManifestArchived
                                       && e.DataJson.Contains(runId.ToString("D"), StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ArchiveRunsByIdsAsync_when_none_succeed_skips_audit()
    {
        Mock<IAuditService> audit = new();
        Mock<IActorContext> actor = ActorMock();
        Mock<IDbConnectionFactory> factory = new(MockBehavior.Strict);

        AdminDiagnosticsService sut = CreateDiagnosticsService(
            factory,
            SqlOptions(),
            audit,
            actor,
            out _,
            out _,
            out _,
            out _,
            out Mock<IRunRepository> runs);

        Guid requestId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        RunArchiveByIdsResult byIds = new()
        {
            SucceededRunIds = [],
            ArchivedRuns = [],
            Failed = [],
            ChildCascade = new RunArchiveChildCascadeCounts()
        };

        _ = runs
            .Setup(r => r.ArchiveRunsByIdsAsync(
                It.Is<IReadOnlyList<Guid>>(list => list.Count == 1 && list[0] == requestId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(byIds);

        _ = await sut.ArchiveRunsByIdsAsync(new[] { requestId }, CancellationToken.None);

        audit.Verify(
            service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ArchiveRunsByIdsAsync_when_succeeded_logs_manifest_archived()
    {
        Mock<IAuditService> audit = new();
        Mock<IActorContext> actor = ActorMock();
        Mock<IDbConnectionFactory> factory = new(MockBehavior.Strict);

        AdminDiagnosticsService sut = CreateDiagnosticsService(
            factory,
            SqlOptions(),
            audit,
            actor,
            out _,
            out _,
            out _,
            out _,
            out Mock<IRunRepository> runs);

        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        RunArchiveByIdsResult byIds = new()
        {
            SucceededRunIds = [runId],
            ArchivedRuns =
            [
                new ArchivedRunScopeRow
                {
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = projectId
                }
            ],
            Failed = [],
            ChildCascade = new RunArchiveChildCascadeCounts()
        };

        _ = runs
            .Setup(r => r.ArchiveRunsByIdsAsync(
                It.Is<IReadOnlyList<Guid>>(list => list.Count == 1 && list[0] == runId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(byIds);

        _ = await sut.ArchiveRunsByIdsAsync(new[] { runId }, CancellationToken.None);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.ManifestArchived
                                       && e.DataJson.Contains("\"byIds\"", StringComparison.Ordinal)
                                       && e.DataJson.Contains(runId.ToString("D"), StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
                Times.Once);
    }

    [Fact]
    public async Task ArchiveRunsCreatedBeforeAsync_audit_caps_sample_run_ids_at_64_and_sets_actor()
    {
        Mock<IAuditService> audit = new();
        Mock<IActorContext> actor = ActorMock();
        Mock<IDbConnectionFactory> factory = new(MockBehavior.Strict);

        AdminDiagnosticsService sut = CreateDiagnosticsService(
            factory,
            SqlOptions(),
            audit,
            actor,
            out _,
            out _,
            out _,
            out _,
            out Mock<IRunRepository> runs);

        List<Guid> runIds = Enumerable.Range(0, 65)
            .Select(static i => Guid.Parse($"10000000-0000-4000-8000-{i:x012}"))
            .ToList();

        RunArchiveBatchResult batch = new()
        {
            UpdatedCount = 65,
            ArchivedRuns =
                [..runIds.Select(r => new ArchivedRunScopeRow
                {
                    RunId = r,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    ScopeProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
                })],
            ChildCascade = new RunArchiveChildCascadeCounts { GoldenManifests = 3, FindingsSnapshots = 2 }
        };

        DateTimeOffset cutoff = DateTimeOffset.Parse("2022-02-02T02:02:02Z", CultureInfo.InvariantCulture);
        _ = runs.Setup(r => r.ArchiveRunsCreatedBeforeAsync(cutoff, It.IsAny<CancellationToken>())).ReturnsAsync(batch);

        _ = await sut.ArchiveRunsCreatedBeforeAsync(cutoff, CancellationToken.None);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(e =>
                    MatchesArchiveRunsCreatedBeforeAuditCapsSample(e, runIds[0])),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ArchiveRunsByIdsAsync_audit_caps_sample_run_ids_at_64_and_sets_actor()
    {
        Mock<IAuditService> audit = new();
        Mock<IActorContext> actor = ActorMock();
        Mock<IDbConnectionFactory> factory = new(MockBehavior.Strict);

        AdminDiagnosticsService sut = CreateDiagnosticsService(
            factory,
            SqlOptions(),
            audit,
            actor,
            out _,
            out _,
            out _,
            out _,
            out Mock<IRunRepository> runs);

        List<Guid> succeededRunIds = Enumerable.Range(0, 65)
            .Select(static i => Guid.Parse($"20000000-0000-4000-8000-{i:x012}"))
            .ToList();

        RunArchiveByIdsResult byIds = new()
        {
            SucceededRunIds = succeededRunIds,
            ArchivedRuns =
                [..succeededRunIds.Select(r => new ArchivedRunScopeRow
                {
                    RunId = r,
                    TenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                    WorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                    ScopeProjectId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff")
                })],
            Failed = [],
            ChildCascade = new RunArchiveChildCascadeCounts()
        };

        _ = runs
            .Setup(r => r.ArchiveRunsByIdsAsync(succeededRunIds, It.IsAny<CancellationToken>()))
            .ReturnsAsync(byIds);

        _ = await sut.ArchiveRunsByIdsAsync(succeededRunIds, CancellationToken.None);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(e => MatchesArchiveRunsByIdsAuditCapsSample(e)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetLeasesAsync_returns_repository_rows()
    {
        Mock<IAuditService> audit = new();
        Mock<IActorContext> actor = ActorMock();
        Mock<IDbConnectionFactory> factory = new(MockBehavior.Strict);

        AdminDiagnosticsService sut = CreateDiagnosticsService(
            factory,
            SqlOptions(),
            audit,
            actor,
            out _,
            out _,
            out _,
            out Mock<IHostLeaderLeaseRepository> hostLeases,
            out _);

        HostLeaderLeaseSnapshot leaseRow = new()
        {
            LeaseName = "test-lease",
            HolderInstanceId = "holder-a",
            LeaseExpiresUtc =
                DateTime.Parse("2035-06-01T00:00:00Z", CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal)
        };

        _ = hostLeases.Setup(h => h.ListAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<HostLeaderLeaseSnapshot> { leaseRow });

        IReadOnlyList<HostLeaderLeaseSnapshot> rows =
            await sut.GetLeasesAsync(CancellationToken.None);

        Assert.Single(rows);
        Assert.Equal("test-lease", rows[0].LeaseName);
        Assert.Equal("holder-a", rows[0].HolderInstanceId);
    }

    [Fact]
    public async Task ListIntegrationOutboxDeadLettersAsync_delegates_to_integration_repository()
    {
        Mock<IAuditService> audit = new();
        Mock<IActorContext> actor = ActorMock();
        Mock<IDbConnectionFactory> factory = new(MockBehavior.Strict);

        AdminDiagnosticsService sut = CreateDiagnosticsService(
            factory,
            SqlOptions(),
            audit,
            actor,
            out _,
            out _,
            out Mock<IIntegrationEventOutboxRepository> integration,
            out _,
            out _);

        IntegrationEventOutboxDeadLetterRow row = new()
        {
            OutboxId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            RunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            EventType = IntegrationEventTypes.AlertFiredV1,
            DeadLetteredUtc =
                DateTime.Parse("2026-02-02T08:00:00Z", CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal),
            RetryCount = 4,
            LastErrorMessage = "timeout"
        };

        _ = integration.Setup(i => i.ListDeadLettersAsync(25, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<IntegrationEventOutboxDeadLetterRow> { row });

        IReadOnlyList<IntegrationEventOutboxDeadLetterRow> letters =
            await sut.ListIntegrationOutboxDeadLettersAsync(25, CancellationToken.None);

        Assert.Single(letters);
        Assert.Equal(row.OutboxId, letters[0].OutboxId);
        Assert.Equal(IntegrationEventTypes.AlertFiredV1, letters[0].EventType);
        integration.Verify(
            i => i.ListDeadLettersAsync(25, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLetterAsync_returns_repository_boolean()
    {
        Mock<IAuditService> audit = new();
        Mock<IActorContext> actor = ActorMock();
        Mock<IDbConnectionFactory> factory = new(MockBehavior.Strict);

        AdminDiagnosticsService sut = CreateDiagnosticsService(
            factory,
            SqlOptions(),
            audit,
            actor,
            out _,
            out _,
            out Mock<IIntegrationEventOutboxRepository> integration,
            out _,
            out _);

        Guid outboxId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        _ = integration.Setup(i => i.ResetDeadLetterForRetryAsync(outboxId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        bool ok = await sut.RetryIntegrationOutboxDeadLetterAsync(outboxId, CancellationToken.None);

        Assert.True(ok);
        integration.Verify(
            i => i.ResetDeadLetterForRetryAsync(outboxId, It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.IntegrationOutboxDeadLetterRetried),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SuppressIntegrationOutboxDeadLetterAsync_logs_audit_when_row_suppressed()
    {
        Mock<IAuditService> audit = new();
        Mock<IActorContext> actor = ActorMock();
        Mock<IDbConnectionFactory> factory = new(MockBehavior.Strict);

        AdminDiagnosticsService sut = CreateDiagnosticsService(
            factory,
            SqlOptions(),
            audit,
            actor,
            out _,
            out _,
            out Mock<IIntegrationEventOutboxRepository> integration,
            out _,
            out _);

        Guid outboxId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        _ = integration.Setup(i => i.AcknowledgeDeadLetterAsync(outboxId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        bool ok = await sut.SuppressIntegrationOutboxDeadLetterAsync(
            outboxId,
            new IntegrationOutboxDeadLetterSuppressRequest { Comment = "known bad payload" },
            CancellationToken.None);

        Assert.True(ok);
        integration.Verify(
            i => i.AcknowledgeDeadLetterAsync(outboxId, It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.IntegrationOutboxDeadLetterSuppressed),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RetryIntegrationOutboxDeadLettersAsync_logs_audit_when_rows_retried()
    {
        Mock<IAuditService> audit = new();
        Mock<IActorContext> actor = ActorMock();
        Mock<IDbConnectionFactory> factory = new(MockBehavior.Strict);

        AdminDiagnosticsService sut = CreateDiagnosticsService(
            factory,
            SqlOptions(),
            audit,
            actor,
            out _,
            out _,
            out Mock<IIntegrationEventOutboxRepository> integration,
            out _,
            out _);

        Guid outboxId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        _ = integration
            .Setup(i => i.RetryMatchingDeadLettersAsync(
                null,
                IntegrationEventTypes.ManifestFinalizedV1,
                100,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IntegrationOutboxDeadLetterBulkRetryResult
            {
                RetriedCount = 1,
                RetriedOutboxIds = [outboxId]
            });

        IntegrationOutboxDeadLetterBulkRetryRequest request = new()
        {
            EventType = IntegrationEventTypes.ManifestFinalizedV1,
            MaxRows = 100
        };

        IntegrationOutboxDeadLetterBulkRetryResponse response =
            await sut.RetryIntegrationOutboxDeadLettersAsync(request, CancellationToken.None);

        Assert.Equal(1, response.RetriedCount);
        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.IntegrationOutboxDeadLetterRetried),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    /// <remarks>Moq <see cref="It.Is{TValue}"/> requires an expression-tree lambda; keep checks in this helper.</remarks>
    private static bool MatchesArchiveRunsCreatedBeforeAuditCapsSample(AuditEvent auditEvent, Guid expectedFirstSampleRunId)
    {
        if (auditEvent.EventType != AuditEventTypes.ManifestArchived
            || auditEvent.ActorUserId != "test-admin"
            || auditEvent.ActorUserName != "test-admin"
            || auditEvent.DataJson == null // CS8122: Moq expression trees — cannot use `is null` upstream of It.Is
            || !auditEvent.DataJson.Contains("createdBefore:", StringComparison.Ordinal))
            return false;

        using JsonDocument doc = JsonDocument.Parse(auditEvent.DataJson);
        JsonElement root = doc.RootElement;

        if (root.GetProperty("updatedRuns").GetInt32() != 65)
            return false;

        if (root.GetProperty("sampleRunIds").GetArrayLength() != 64)
            return false;

        if (root.GetProperty("childCascade").GetProperty("GoldenManifests").GetInt32() != 3)
            return false;

        string firstSample = root.GetProperty("sampleRunIds")[0].GetString() ?? string.Empty;

        return firstSample == expectedFirstSampleRunId.ToString("D", CultureInfo.InvariantCulture);
    }

    /// <remarks>Moq <see cref="It.Is{TValue}"/> requires an expression-tree lambda; keep checks in this helper.</remarks>
    private static bool MatchesArchiveRunsByIdsAuditCapsSample(AuditEvent auditEvent)
    {
        if (auditEvent.EventType != AuditEventTypes.ManifestArchived
            || auditEvent.ActorUserId != "test-admin"
            || auditEvent.ActorUserName != "test-admin"
            || auditEvent.DataJson == null // CS8122: Moq expression trees — cannot use `is null` upstream of It.Is
            || !auditEvent.DataJson.Contains("\"byIds\"", StringComparison.Ordinal))
            return false;

        using JsonDocument doc = JsonDocument.Parse(auditEvent.DataJson);

        return doc.RootElement.GetProperty("sampleRunIds").GetArrayLength() == 64;
    }

    private static Mock<IActorContext> ActorMock()
    {
        Mock<IActorContext> actor = new();
        _ = actor.Setup(a => a.GetActor()).Returns("test-admin");

        return actor;
    }

    private static IOptions<ArchLucidOptions> SqlOptions()
    {
        ArchLucidOptions o = new()
        {
            StorageProvider = "Sql"
        };

        return Options.Create(o);
    }

    private static IOptions<ArchLucidOptions> InMemoryOptions()
    {
        ArchLucidOptions o = new()
        {
            StorageProvider = "InMemory"
        };

        return Options.Create(o);
    }

    private static AdminDiagnosticsService CreateDiagnosticsService(
        Mock<IDbConnectionFactory> connectionFactory,
        IOptions<ArchLucidOptions> archLucidOptions,
        Mock<IAuditService> audit,
        Mock<IActorContext> actor,
        out Mock<IAuthorityPipelineWorkRepository> authority,
        out Mock<IRetrievalIndexingOutboxRepository> retrieval,
        out Mock<IIntegrationEventOutboxRepository> integration,
        out Mock<IHostLeaderLeaseRepository> hostLeases,
        out Mock<IRunRepository> runRepository)
    {
        return CreateDiagnosticsService(
            connectionFactory,
            archLucidOptions,
            audit,
            actor,
            CacheTelemetryProvider(),
            out authority,
            out retrieval,
            out integration,
            out hostLeases,
            out runRepository);
    }

    private static AdminDiagnosticsService CreateDiagnosticsService(
        Mock<IDbConnectionFactory> connectionFactory,
        IOptions<ArchLucidOptions> archLucidOptions,
        Mock<IAuditService> audit,
        Mock<IActorContext> actor,
        ICacheTelemetrySnapshotProvider cacheTelemetrySnapshotProvider,
        out Mock<IAuthorityPipelineWorkRepository> authority,
        out Mock<IRetrievalIndexingOutboxRepository> retrieval,
        out Mock<IIntegrationEventOutboxRepository> integration,
        out Mock<IHostLeaderLeaseRepository> hostLeases,
        out Mock<IRunRepository> runRepository)
    {
        authority = new Mock<IAuthorityPipelineWorkRepository>();
        retrieval = new Mock<IRetrievalIndexingOutboxRepository>();
        integration = new Mock<IIntegrationEventOutboxRepository>();
        hostLeases = new Mock<IHostLeaderLeaseRepository>();
        runRepository = new Mock<IRunRepository>();

        return new AdminDiagnosticsService(
            authority.Object,
            retrieval.Object,
            integration.Object,
            hostLeases.Object,
            runRepository.Object,
            connectionFactory.Object,
            archLucidOptions,
            Options.Create(new IntegrationEventsOptions()),
            cacheTelemetrySnapshotProvider,
            actor.Object,
            audit.Object);
    }

    private static ICacheTelemetrySnapshotProvider CacheTelemetryProvider()
    {
        Mock<ICacheTelemetrySnapshotProvider> cacheTelemetry = new();

        _ = cacheTelemetry.Setup(c => c.GetSnapshot()).Returns(new CacheTelemetrySnapshot
        {
            HotPathReadCacheHits = 10,
            HotPathReadCacheMisses = 2,
            ExplanationCacheHits = 5,
            ExplanationCacheMisses = 1,
            LlmCompletionCacheHits = 20,
            LlmCompletionCacheMisses = 3,
            GraphProjectionCacheHits = 4,
            GraphProjectionCacheMisses = 0,
            GraphProjectionCacheEnabled = true,
        });

        return cacheTelemetry.Object;
    }
}
