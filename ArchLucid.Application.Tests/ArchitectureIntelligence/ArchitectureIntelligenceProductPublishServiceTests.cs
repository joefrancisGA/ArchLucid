using ArchLucid.Application.Architecture;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using FluentAssertions;
using Moq;
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

    [Theory]
    [InlineData("Disabled", false, false, false, PublicNetworkAccessVerificationOutcome.Verified, true)]
    [InlineData("Enabled", false, false, false, PublicNetworkAccessVerificationOutcome.Contradicted, false)]
    [InlineData("Disabled", true, false, false, PublicNetworkAccessVerificationOutcome.Unverified, false)]
    [InlineData("Disabled", false, true, false, PublicNetworkAccessVerificationOutcome.Unverified, false)]
    [InlineData("Disabled", false, false, true, PublicNetworkAccessVerificationOutcome.Verified, false)]
    [InlineData(null, false, false, false, PublicNetworkAccessVerificationOutcome.Unverified, false)]
    public async Task Scoped_inventory_controls_the_gate_and_persisted_finding(
        string? value, bool stale, bool foreign, bool cacheHit,
        PublicNetworkAccessVerificationOutcome expected, bool shouldPublish)
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Guid architectureId = Guid.NewGuid(), runId = Guid.NewGuid(), snapshotId = Guid.NewGuid();
        Guid assetId = Guid.NewGuid(), rowId = Guid.NewGuid();
        Mock<IScopeContextProvider> scopes = new();
        scopes.Setup(x => x.GetCurrentScope()).Returns(scope);
        Mock<IActorContext> actor = new();
        actor.Setup(x => x.GetActorId()).Returns("reviewer");
        Mock<IRunRepository> runs = new();
        runs.Setup(x => x.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId, ArchitectureId = architectureId,
                TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ScopeProjectId = scope.ProjectId });
        Mock<IArchitectureShareAccessService> shares = new();
        shares.Setup(x => x.EvaluateAsync(It.IsAny<ScopeContext>(), architectureId, "reviewer",
                true, false, false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureShareAccessEvaluation { ArchitectureFound = true, CanRead = true });
        Mock<IArchitectureInventoryBindingService> bindings = new();
        bindings.Setup(x => x.TryGetBindingAsync(It.IsAny<ScopeContext>(), architectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureInventoryBindingResponse { ArchitectureId = architectureId,
                IsBound = true, SnapshotId = snapshotId });
        Mock<IAzureInventorySnapshotRepository> snapshots = new();
        snapshots.Setup(x => x.TryGetBySnapshotIdAsync(It.IsAny<ScopeContext>(), snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotRecord { SnapshotId = snapshotId, TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId, ProjectId = foreign ? Guid.NewGuid() : scope.ProjectId,
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded, CapturedUtc = DateTime.UtcNow.AddHours(stale ? -25 : -1) });
        IReadOnlyList<AzureInventoryResourceRecord> resources =
            [new() { SnapshotId = snapshotId, TenantId = scope.TenantId, ResourceRowId = rowId, CloudResourceId = assetId }];
        IReadOnlyList<AzureInventoryResourcePropertyReadModel> properties =
            [new() { ResourceRowId = rowId, PropertyKey = "properties.publicNetworkAccess", PropertyValue = value }];
        snapshots.Setup(x => x.ListResourcesAndPropertiesByCloudResourceIdsAsync(
                It.IsAny<ScopeContext>(), snapshotId, It.Is<IReadOnlyList<Guid>>(ids => ids.Count == 1 && ids[0] == assetId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((resources, properties));
        var verifier = new ScopedPublicNetworkAccessVerifier(scopes.Object, actor.Object, runs.Object,
            shares.Object, bindings.Object, snapshots.Object);

        string tenant = scope.TenantId.ToString("D"), workspace = scope.WorkspaceId.ToString("D");
        string project = scope.ProjectId.ToString("D"), run = runId.ToString("D");
        var observation = await verifier.VerifyAsync(tenant, workspace, project, run, assetId, default);
        observation.Outcome.Should().Be(expected);

        SpecialistReviewFinding candidate = new()
        {
            FindingId = "asset-claim", Title = "The resource cannot be reached publicly.",
            PublicNetworkAccessDisabledResourceId = assetId, Confidence = 1,
        };
        EvidenceValidationResult validation = new()
        {
            FindingId = candidate.FindingId, OverallPassedIntegrity = true,
            SemanticAssessment = SemanticSupportAssessment.Supports, PublicNetworkAccess = observation,
        };
        var decision = new TrustPublishGate().Decide([candidate], [], [validation], []);
        decision.PublishableFindings.Should().HaveCount(expected == PublicNetworkAccessVerificationOutcome.Verified ? 1 : 0);

        // Exercise publication with a previously prepared product finding, even when the current record contradicts it.
        var priorProof = new EvidenceValidationResult { FindingId = candidate.FindingId,
            PublicNetworkAccess = new(assetId, PublicNetworkAccessVerificationOutcome.Verified, snapshotId, DateTime.UtcNow) };
        ClosedLoopReasoningResult result = new()
        {
            CacheHit = cacheHit,
            ProductFindings = ArchitectureIntelligenceProductBridge.ToFindings([candidate],
                new Dictionary<string, EvidenceValidationResult> { [candidate.FindingId] = priorProof })
        };
        RecordingFindingsRepository findings = new();
        ServiceCollection services = new();
        services.AddSingleton<IFindingsSnapshotRepository>(findings);
        services.AddSingleton(verifier);
        await using ServiceProvider provider = services.BuildServiceProvider();
        var published = await new ArchitectureIntelligenceProductPublishService(provider)
            .PublishAsync(result, tenant, workspace, project, run);

        published.Published.Should().Be(shouldPublish);
        if (shouldPublish)
            findings.Saved.Should().ContainSingle().Which.Findings.Should().ContainSingle()
                .Which.Title.Should().Be(ScopedPublicNetworkAccessVerifier.Title(assetId));
        else
            findings.Saved.Should().BeEmpty();

        if (stale || foreign)
            snapshots.Verify(x => x.ListResourcesAndPropertiesByCloudResourceIdsAsync(
                It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()), Times.Never);
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

        public Task<RecommendationRecord?> GetByIdAsync(ScopeContext scope, Guid recommendationId, CancellationToken ct)
        {
            _ = scope;
            _ = recommendationId;
            _ = ct;
            return Task.FromResult<RecommendationRecord?>(null);
        }

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
