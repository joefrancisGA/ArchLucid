using ArchLucid.Application.Findings;
using ArchLucid.Application.Findings.PortfolioRecurrence;
using ArchLucid.Application.Findings.PortfolioSharedTopology;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Application")]
public sealed class PortfolioSharedTopologyFindingEngineTests
{
    private const string SharedArmResourceId =
        "/subscriptions/00000000-0000-0000-0000-000000000001/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sharedacct";

    [Fact]
    public void PortfolioSharedTopologyFindingOptions_default_enabled_is_false()
    {
        PortfolioSharedTopologyFindingOptions options = new();

        options.Enabled.Should().BeFalse();
        options.MaxSystemsScanned.Should().Be(50);
        options.MaxFindings.Should().Be(8);
    }

    [Fact]
    public async Task AnalyzeAsync_when_disabled_returns_empty_without_repository_calls()
    {
        Mock<IRunDetailQueryService> runQuery = new();
        Mock<IGraphSnapshotRepository> graphRepository = new();
        PortfolioSharedTopologyFindingEngine engine = CreateEngine(
            runQuery,
            graphRepository,
            enabled: false);

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(
            CreateGraphSnapshot(Guid.NewGuid(), []),
            null,
            CancellationToken.None);

        findings.Should().BeEmpty();
        runQuery.Verify(
            query => query.ListRunSummariesKeysetAsync(
                It.IsAny<string?>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        graphRepository.Verify(
            repository => repository.GetByIdAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task AnalyzeAsync_when_same_arm_id_and_public_posture_differs_emits_one_finding()
    {
        Guid currentRunId = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        Guid peerRunId = Guid.Parse("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        Guid currentGraphId = Guid.Parse("cccccccccccccccccccccccccccccccc");
        Guid peerGraphId = Guid.Parse("dddddddddddddddddddddddddddddddd");

        GraphSnapshot currentGraph = CreateGraphSnapshot(
            currentRunId,
            [
                CreateStorageNode(
                    "node-current",
                    SharedArmResourceId,
                    publicNetworkAccess: "Enabled"),
            ]);

        GraphSnapshot peerGraph = CreateGraphSnapshot(
            peerRunId,
            [
                CreateStorageNode(
                    "node-peer",
                    SharedArmResourceId,
                    publicNetworkAccess: "Disabled"),
            ]);

        List<RunSummary> summaries =
        [
            CreateCommittedSummary(currentRunId, "Payments", new DateTime(2026, 8, 20, 0, 0, 0, DateTimeKind.Utc)),
            CreateCommittedSummary(peerRunId, "Sandbox", new DateTime(2026, 8, 19, 0, 0, 0, DateTimeKind.Utc)),
        ];

        Mock<IRunDetailQueryService> runQuery = CreateRunQueryMock(
            summaries,
            currentRunId,
            currentGraphId,
            peerRunId,
            peerGraphId);

        Mock<IGraphSnapshotRepository> graphRepository = new();
        graphRepository
            .Setup(repository => repository.GetByIdAsync(It.IsAny<ScopeContext>(), peerGraphId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(peerGraph);

        PortfolioSharedTopologyFindingEngine engine = CreateEngine(runQuery, graphRepository, enabled: true);

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(currentGraph, null, CancellationToken.None);

        findings.Should().ContainSingle();
        Finding finding = findings[0];
        finding.EngineType.Should().Be("portfolio-shared-topology");
        finding.Title.Should().Contain(SharedArmResourceId);
        finding.Title.Should().Contain("Sandbox");
        finding.Title.Should().Contain("PublicNetworkAccess");
        finding.RelatedNodeIds.Should().ContainSingle("node-current");
        finding.EvidenceRefs.Should().Contain(SharedArmResourceId);

        PortfolioSharedTopologyFindingPayload payload =
            finding.Payload.Should().BeOfType<PortfolioSharedTopologyFindingPayload>().Subject;
        payload.ResourceIdNormalized.Should().Be(SharedArmResourceId);
        payload.OtherSystemId.Should().Be("Sandbox");
        payload.OtherRunId.Should().Be(peerRunId.ToString("N"));
        payload.ThisPosture.Should().Contain("PublicNetworkAccess=public");
        payload.OtherPosture.Should().Contain("PublicNetworkAccess=private");
    }

    [Fact]
    public async Task AnalyzeAsync_when_same_arm_id_and_same_posture_returns_empty()
    {
        Guid currentRunId = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        Guid peerRunId = Guid.Parse("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        Guid peerGraphId = Guid.Parse("dddddddddddddddddddddddddddddddd");

        GraphSnapshot currentGraph = CreateGraphSnapshot(
            currentRunId,
            [
                CreateStorageNode(
                    "node-current",
                    SharedArmResourceId,
                    publicNetworkAccess: "Disabled"),
            ]);

        GraphSnapshot peerGraph = CreateGraphSnapshot(
            peerRunId,
            [
                CreateStorageNode(
                    "node-peer",
                    SharedArmResourceId,
                    publicNetworkAccess: "Disabled"),
            ]);

        List<RunSummary> summaries =
        [
            CreateCommittedSummary(currentRunId, "Payments", new DateTime(2026, 8, 20, 0, 0, 0, DateTimeKind.Utc)),
            CreateCommittedSummary(peerRunId, "Sandbox", new DateTime(2026, 8, 19, 0, 0, 0, DateTimeKind.Utc)),
        ];

        Mock<IRunDetailQueryService> runQuery = CreateRunQueryMock(
            summaries,
            currentRunId,
            Guid.Parse("cccccccccccccccccccccccccccccccc"),
            peerRunId,
            peerGraphId);

        Mock<IGraphSnapshotRepository> graphRepository = new();
        graphRepository
            .Setup(repository => repository.GetByIdAsync(It.IsAny<ScopeContext>(), peerGraphId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(peerGraph);

        PortfolioSharedTopologyFindingEngine engine = CreateEngine(runQuery, graphRepository, enabled: true);

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(currentGraph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_when_label_only_node_ids_returns_empty()
    {
        Guid currentRunId = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        Guid peerRunId = Guid.Parse("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        Guid peerGraphId = Guid.Parse("dddddddddddddddddddddddddddddddd");

        GraphSnapshot currentGraph = CreateGraphSnapshot(
            currentRunId,
            [
                CreateStorageNode(
                    "node-current",
                    "storage-1",
                    publicNetworkAccess: "Enabled"),
            ]);

        GraphSnapshot peerGraph = CreateGraphSnapshot(
            peerRunId,
            [
                CreateStorageNode(
                    "node-peer",
                    "storage-1",
                    publicNetworkAccess: "Disabled"),
            ]);

        List<RunSummary> summaries =
        [
            CreateCommittedSummary(currentRunId, "Payments", new DateTime(2026, 8, 20, 0, 0, 0, DateTimeKind.Utc)),
            CreateCommittedSummary(peerRunId, "Sandbox", new DateTime(2026, 8, 19, 0, 0, 0, DateTimeKind.Utc)),
        ];

        Mock<IRunDetailQueryService> runQuery = CreateRunQueryMock(
            summaries,
            currentRunId,
            Guid.Parse("cccccccccccccccccccccccccccccccc"),
            peerRunId,
            peerGraphId);

        Mock<IGraphSnapshotRepository> graphRepository = new();
        graphRepository
            .Setup(repository => repository.GetByIdAsync(It.IsAny<ScopeContext>(), peerGraphId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(peerGraph);

        PortfolioSharedTopologyFindingEngine engine = CreateEngine(runQuery, graphRepository, enabled: true);

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(currentGraph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_loads_peer_graphs_with_current_scope_context_only()
    {
        Guid currentRunId = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        Guid peerRunId = Guid.Parse("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        Guid peerGraphId = Guid.Parse("dddddddddddddddddddddddddddddddd");
        ScopeContext expectedScope = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };

        GraphSnapshot currentGraph = CreateGraphSnapshot(
            currentRunId,
            [
                CreateStorageNode(
                    "node-current",
                    SharedArmResourceId,
                    publicNetworkAccess: "Enabled"),
            ]);

        GraphSnapshot peerGraph = CreateGraphSnapshot(
            peerRunId,
            [
                CreateStorageNode(
                    "node-peer",
                    SharedArmResourceId,
                    publicNetworkAccess: "Disabled"),
            ]);

        List<RunSummary> summaries =
        [
            CreateCommittedSummary(currentRunId, "Payments", new DateTime(2026, 8, 20, 0, 0, 0, DateTimeKind.Utc)),
            CreateCommittedSummary(peerRunId, "Sandbox", new DateTime(2026, 8, 19, 0, 0, 0, DateTimeKind.Utc)),
        ];

        Mock<IRunDetailQueryService> runQuery = CreateRunQueryMock(
            summaries,
            currentRunId,
            Guid.Parse("cccccccccccccccccccccccccccccccc"),
            peerRunId,
            peerGraphId);

        Mock<IGraphSnapshotRepository> graphRepository = new();
        graphRepository
            .Setup(repository => repository.GetByIdAsync(expectedScope, peerGraphId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(peerGraph);

        PortfolioSharedTopologyFindingEngine engine = CreateEngine(
            runQuery,
            graphRepository,
            enabled: true,
            scope: expectedScope);

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(currentGraph, null, CancellationToken.None);

        findings.Should().ContainSingle();
        graphRepository.Verify(
            repository => repository.GetByIdAsync(
                It.Is<ScopeContext>(scope =>
                    scope.TenantId == expectedScope.TenantId
                    && scope.WorkspaceId == expectedScope.WorkspaceId
                    && scope.ProjectId == expectedScope.ProjectId),
                peerGraphId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static PortfolioSharedTopologyFindingEngine CreateEngine(
        Mock<IRunDetailQueryService> runQuery,
        Mock<IGraphSnapshotRepository> graphRepository,
        bool enabled,
        ScopeContext? scope = null)
    {
        ScopeContext effectiveScope = scope ?? new ScopeContext
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(effectiveScope);

        return new PortfolioSharedTopologyFindingEngine(
            scopeProvider.Object,
            CreateOptionsResolver(enabled),
            new PortfolioRunScanSource(runQuery.Object, NullLogger<PortfolioRunScanSource>.Instance),
            new SharedTopologyMatcher(runQuery.Object, graphRepository.Object),
            new PortfolioSharedTopologyFindingEmitter());
    }

    private static IPortfolioSharedTopologyFindingOptionsResolver CreateOptionsResolver(bool enabled)
    {
        Mock<IPortfolioSharedTopologyFindingOptionsResolver> resolver = new();
        PortfolioSharedTopologyFindingOptions options = new()
        {
            Enabled = enabled,
            MaxSystemsScanned = 50,
            MaxFindings = 8,
        };

        resolver.Setup(r => r.Resolve(It.IsAny<CancellationToken>())).Returns(options);

        return resolver.Object;
    }

    private static Mock<IRunDetailQueryService> CreateRunQueryMock(
        List<RunSummary> summaries,
        Guid currentRunId,
        Guid currentGraphId,
        Guid peerRunId,
        Guid peerGraphId)
    {
        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((summaries, false, null));

        runQuery
            .Setup(query => query.GetRunDetailForRoiAsync(currentRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateRunDetail(currentRunId.ToString("N"), currentGraphId));

        runQuery
            .Setup(query => query.GetRunDetailForRoiAsync(peerRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateRunDetail(peerRunId.ToString("N"), peerGraphId));

        return runQuery;
    }

    private static GraphSnapshot CreateGraphSnapshot(Guid runId, IReadOnlyList<GraphNode> nodes) =>
        new()
        {
            RunId = runId,
            Nodes = nodes.ToList(),
        };

    private static GraphNode CreateStorageNode(
        string nodeId,
        string resourceId,
        string publicNetworkAccess) =>
        new()
        {
            NodeId = nodeId,
            NodeType = "StorageAccount",
            Label = nodeId,
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["armResourceId"] = resourceId,
                ["publicNetworkAccess"] = publicNetworkAccess,
            },
        };

    private static RunSummary CreateCommittedSummary(Guid runId, string systemName, DateTime createdUtc) =>
        new()
        {
            RunId = runId.ToString("N"),
            SystemName = systemName,
            Status = nameof(ArchitectureRunStatus.Committed),
            CreatedUtc = createdUtc,
            CurrentManifestVersion = "v1",
        };

    private static ArchitectureRunDetail CreateRunDetail(string runId, Guid graphSnapshotId) =>
        new()
        {
            Run = new ArchitectureRun
            {
                RunId = runId,
                GraphSnapshotId = graphSnapshotId,
                Status = ArchitectureRunStatus.Committed,
            },
        };
}
