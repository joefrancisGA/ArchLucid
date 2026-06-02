using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.KnowledgeGraph.Caching;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using Moq;

namespace ArchLucid.Persistence.Tests.Queries;
[Trait("Category", "Unit")]

public sealed class AuthorityQueryServiceGetRunDetailArtifactBundleTests
{
    [Theory]
    [InlineData(typeof(InMemoryAuthorityQueryService))]
    [InlineData(typeof(DapperAuthorityQueryService))]
    public async Task GetRunDetailAsync_loads_bundle_by_manifest_when_golden_manifest_set_but_bundle_row_id_null(
        Type implementationType)
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };

        RunRecord run = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ScopeProjectId = projectId,
            RunId = runId,
            ProjectId = "default",
            GoldenManifestId = manifestId,
            ArtifactBundleId = null
        };

        ArtifactBundle bundle = new() { ManifestId = manifestId, BundleId = Guid.NewGuid() };

        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(scope, runId, It.IsAny<CancellationToken>())).ReturnsAsync(run);

        Mock<IContextSnapshotRepository> contextSnapshots = new();
        Mock<IGraphSnapshotRepository> graphSnapshots = new();
        Mock<IFindingsSnapshotRepository> findingsSnapshots = new();
        Mock<IDecisionTraceRepository> traces = new();
        Mock<IGoldenManifestRepository> manifests = new();
        Mock<IArtifactBundleRepository> bundles = new();
        bundles
            .Setup(b =>
                b.GetByManifestIdAsync(scope, manifestId, It.Is<bool>(v => v), It.IsAny<CancellationToken>()))
            .ReturnsAsync(bundle);

        Mock<IAgentExecutionTraceRepository> traceRows = CreateTraceRepoStub();

        IAuthorityQueryService sut = CreateQueryService(
            implementationType,
            runs.Object,
            contextSnapshots.Object,
            graphSnapshots.Object,
            findingsSnapshots.Object,
            traces.Object,
            manifests.Object,
            bundles.Object,
            traceRows.Object);

        RunDetailDto? detail = await sut.GetRunDetailAsync(scope, runId, CancellationToken.None);

        detail.Should().NotBeNull();
        detail.ArtifactBundle.Should().BeSameAs(bundle);
        bundles.Verify(
            b => b.GetByManifestIdAsync(scope, manifestId, It.Is<bool>(v => v), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Theory]
    [InlineData(typeof(InMemoryAuthorityQueryService))]
    [InlineData(typeof(DapperAuthorityQueryService))]
    public async Task GetRunDetailAsync_does_not_query_bundle_when_no_golden_manifest(Type implementationType)
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };

        RunRecord run = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ScopeProjectId = projectId,
            RunId = runId,
            ProjectId = "default",
            GoldenManifestId = null,
            ArtifactBundleId = Guid.NewGuid()
        };

        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(scope, runId, It.IsAny<CancellationToken>())).ReturnsAsync(run);

        Mock<IContextSnapshotRepository> contextSnapshots = new();
        Mock<IGraphSnapshotRepository> graphSnapshots = new();
        Mock<IFindingsSnapshotRepository> findingsSnapshots = new();
        Mock<IDecisionTraceRepository> traces = new();
        Mock<IGoldenManifestRepository> manifests = new();
        Mock<IArtifactBundleRepository> bundles = new();

        Mock<IAgentExecutionTraceRepository> traceRows = CreateTraceRepoStub();

        IAuthorityQueryService sut = CreateQueryService(
            implementationType,
            runs.Object,
            contextSnapshots.Object,
            graphSnapshots.Object,
            findingsSnapshots.Object,
            traces.Object,
            manifests.Object,
            bundles.Object,
            traceRows.Object);

        RunDetailDto? detail = await sut.GetRunDetailAsync(scope, runId, CancellationToken.None);

        detail.Should().NotBeNull();
        detail.ArtifactBundle.Should().BeNull();
        bundles.Verify(
            b =>
                b.GetByManifestIdAsync(
                    It.IsAny<ScopeContext>(),
                    It.IsAny<Guid>(),
                    It.Is<bool>(static v => v),
                    It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static Mock<IAgentExecutionTraceRepository> CreateTraceRepoStub()
    {
        Mock<IAgentExecutionTraceRepository> traceRows = new();
        traceRows
            .Setup(r => r.GetDistinctAgentTypesWithLlmResourceFallbackAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<string>());
        traceRows
            .Setup(r => r.GetDistinctAgentTypesWithLlmResourceFallbackByRunIdsAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<CancellationToken>()))
            .Returns<IReadOnlyList<string>, CancellationToken>((ids, _) =>
            {
                Dictionary<string, IReadOnlyList<string>> map = new(StringComparer.OrdinalIgnoreCase);

                foreach (string id in ids)
                {
                    if (!string.IsNullOrWhiteSpace(id))
                        map[id.Trim()] = [];
                }

                return Task.FromResult<IReadOnlyDictionary<string, IReadOnlyList<string>>>(map);
            });

        return traceRows;
    }

    private static IAuthorityQueryService CreateQueryService(
        Type implementationType,
        IRunRepository runRepository,
        IContextSnapshotRepository contextSnapshotRepository,
        IGraphSnapshotRepository graphSnapshotRepository,
        IFindingsSnapshotRepository findingsSnapshotRepository,
        IDecisionTraceRepository decisionTraceRepository,
        IGoldenManifestRepository goldenManifestRepository,
        IArtifactBundleRepository artifactBundleRepository,
        IAgentExecutionTraceRepository agentExecutionTraceRepository)
    {
        if (implementationType == typeof(InMemoryAuthorityQueryService))
        {
            return new InMemoryAuthorityQueryService(
                runRepository,
                contextSnapshotRepository,
                graphSnapshotRepository,
                NonCachingGraphSnapshotProjectionCache.Instance,
                findingsSnapshotRepository,
                decisionTraceRepository,
                goldenManifestRepository,
                artifactBundleRepository,
                agentExecutionTraceRepository,
                new NoOpFindingReviewTrailRepository(),
                new NoOpRiskExceptionRepository());
        }


        if (implementationType == typeof(DapperAuthorityQueryService))
        {
            return new DapperAuthorityQueryService(
                runRepository,
                contextSnapshotRepository,
                graphSnapshotRepository,
                NonCachingGraphSnapshotProjectionCache.Instance,
                findingsSnapshotRepository,
                decisionTraceRepository,
                goldenManifestRepository,
                artifactBundleRepository,
                agentExecutionTraceRepository,
                new NoOpFindingReviewTrailRepository(),
                new NoOpRiskExceptionRepository());
        }


        throw new ArgumentException($"Unsupported query service type: {implementationType.Name}",
            nameof(implementationType));
    }
}
