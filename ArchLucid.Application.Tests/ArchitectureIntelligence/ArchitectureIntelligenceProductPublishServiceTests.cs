using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using System.Data;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceProductPublishServiceTests
{
    [Fact]
    public async Task PublishAsync_upserts_recommendations_and_saves_findings_snapshot()
    {
        RecordingFindingsRepository findings = new();
        RecordingRecommendationRepository recommendations = new();
        ServiceCollection services = new();
        services.AddSingleton<IFindingsSnapshotRepository>(findings);
        services.AddSingleton<IRecommendationRepository>(recommendations);
        await using ServiceProvider provider = services.BuildServiceProvider();

        ArchitectureIntelligenceProductPublishService sut = new(provider);
        ClosedLoopReasoningResult result = new()
        {
            ProductFindings =
            [
                new Finding
                {
                    FindingId = "f1",
                    Title = "Gap",
                    FindingType = "ArchitectureIntelligence.SpecialistReview",
                    Category = "ArchitectureIntelligence",
                    EngineType = "ArchitectureIntelligence",
                    Severity = FindingSeverity.Error,
                },
            ],
            ProductRecommendations =
            [
                new RecommendationRecord
                {
                    RecommendationId = Guid.NewGuid(),
                    TenantId = Guid.NewGuid(),
                    WorkspaceId = Guid.NewGuid(),
                    ProjectId = Guid.NewGuid(),
                    RunId = Guid.NewGuid(),
                    Title = "Add trust boundary",
                    Status = RecommendationStatus.Proposed,
                    CreatedUtc = DateTime.UtcNow,
                    LastUpdatedUtc = DateTime.UtcNow,
                },
            ],
        };

        ArchitectureIntelligencePublishResult publish = await sut.PublishAsync(
            result,
            tenantId: Guid.NewGuid().ToString("D"),
            workspaceId: Guid.NewGuid().ToString("D"),
            projectId: Guid.NewGuid().ToString("D"),
            runId: Guid.NewGuid().ToString("D"));

        publish.Published.Should().BeTrue();
        findings.Saved.Should().ContainSingle();
        recommendations.Upserted.Should().ContainSingle();
    }

    [Fact]
    public async Task PublishAsync_skips_when_publish_blocked()
    {
        ServiceCollection services = new();
        await using ServiceProvider provider = services.BuildServiceProvider();
        ArchitectureIntelligenceProductPublishService sut = new(provider);

        ArchitectureIntelligencePublishResult publish = await sut.PublishAsync(
            new ClosedLoopReasoningResult { PublishBlocked = true },
            tenantId: "t",
            workspaceId: "w",
            projectId: "p",
            runId: "r");

        publish.Published.Should().BeFalse();
        publish.SkipReason.Should().Contain("blocked");
    }

    private sealed class RecordingFindingsRepository : IFindingsSnapshotRepository
    {
        public List<FindingsSnapshot> Saved { get; } = [];

        public Task SaveAsync(
            FindingsSnapshot snapshot,
            CancellationToken ct,
            IDbConnection? connection = null,
            IDbTransaction? transaction = null)
        {
            Saved.Add(snapshot);
            return Task.CompletedTask;
        }

        public Task<FindingsSnapshot?> GetByIdAsync(ScopeContext scope, Guid findingsSnapshotId, CancellationToken ct) =>
            Task.FromResult<FindingsSnapshot?>(null);

        public Task<FindingsSnapshot?> GetCoverageProjectionByIdAsync(
            ScopeContext scope,
            Guid findingsSnapshotId,
            CancellationToken ct) =>
            Task.FromResult<FindingsSnapshot?>(null);

        public Task<FindingRecordMetadataPage> ListFindingRecordsKeysetAsync(
            ScopeContext scope,
            Guid findingsSnapshotId,
            int? cursorSortOrder,
            Guid? cursorFindingRecordId,
            int? cursorPriorityRank,
            string? severity,
            string? category,
            string? findingType,
            int take,
            bool orderByPriority,
            CancellationToken ct) =>
            Task.FromResult(new FindingRecordMetadataPage([], HasMore: false));

        public Task UpdatePriorityRanksAsync(
            ScopeContext scope,
            Guid findingsSnapshotId,
            IReadOnlyList<(string FindingId, int PriorityRank)> ranks,
            CancellationToken ct) =>
            Task.CompletedTask;
    }

    private sealed class RecordingRecommendationRepository : IRecommendationRepository
    {
        public List<RecommendationRecord> Upserted { get; } = [];

        public Task UpsertAsync(RecommendationRecord recommendation, CancellationToken ct)
        {
            Upserted.Add(recommendation);
            return Task.CompletedTask;
        }

        public Task<RecommendationRecord?> GetByIdAsync(Guid recommendationId, CancellationToken ct) =>
            Task.FromResult<RecommendationRecord?>(null);

        public Task<IReadOnlyList<RecommendationRecord>> ListByRunAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            Guid runId,
            CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<RecommendationRecord>>([]);

        public Task<IReadOnlyList<RecommendationRecord>> ListByScopeAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            string? status,
            int take,
            CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<RecommendationRecord>>([]);
    }
}
