using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class InfraEvidenceSnapshotMermaidServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

    [Fact]
    public async Task Graph_resolver_builds_nodes_from_synthetic_snapshot_detail()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(resourceCount: 3);
        InMemorySnapshotRepository repository = new() { Snapshots = { [SnapshotId] = snapshot } };
        AzureInventorySnapshotGraphResolver resolver = new(repository);
        ScopeContext scope = CreateScope();

        AzureInventorySnapshotGraphResolveResult result =
            await resolver.TryResolveGraphAsync(scope, SnapshotId, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Graph.Should().NotBeNull();
        result.Graph!.Nodes.Should().HaveCount(3);
        result.Graph.Edges.Should().HaveCount(2);

        GraphNode firstNode = result.Graph.Nodes
            .Should()
            .ContainSingle(node => node.Label == "resource-0")
            .Subject;

        firstNode.NodeType.Should().Be(GraphNodeTypes.TopologyResource);
        firstNode.SourceType.Should().Be("azure-inventory-snapshot");
        firstNode.Properties["arm.type"].Should().Be("Microsoft.Network/virtualNetworks");
        firstNode.Properties["arm.resourceGroup"].Should().Be("rg-network");
        firstNode.Properties.Should().ContainKey("cloudResourceId");
    }

    [Fact]
    public async Task Over_threshold_graph_returns_partitioned_status_in_preview()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(resourceCount: 500);
        InMemorySnapshotRepository repository = new() { Snapshots = { [SnapshotId] = snapshot } };
        InfraEvidenceSnapshotMermaidService service = CreateService(
            repository,
            new MermaidDiagramReadabilityThresholds { MaxNodes = 400 });
        ScopeContext scope = CreateScope();

        InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidPreviewResponse> result =
            await service.TryGetPreviewAsync(scope, SnapshotId, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Value.Should().NotBeNull();

        InfraEvidenceMermaidModePreview fullPreview = result.Value!.Modes
            .Should()
            .ContainSingle(mode => mode.Mode == "full")
            .Subject;

        fullPreview.Status.Should().Be(MermaidDiagramRenderStatus.Partitioned.ToString());
        fullPreview.Mermaid.Should().BeNull();
        fullPreview.FallbackArtifacts.Should().NotBeEmpty();
        fullPreview.NodeCount.Should().BeGreaterThan(400);
    }

    private static InfraEvidenceSnapshotMermaidService CreateService(
        IAzureInventorySnapshotRepository repository,
        MermaidDiagramReadabilityThresholds thresholds)
    {
        MermaidDiagramRenderPipeline pipeline = new(
            new MermaidDiagramRenderer(),
            new MermaidDiagramComplexityAnalyzer(),
            new MermaidDiagramDeterministicRepairer(),
            new MermaidDiagramStructuralValidator(),
            new MermaidDiagramSemanticIntegrityGuard(),
            new MermaidDiagramFallbackSetBuilder(
                new DiagramAstFromGraphCompiler(),
                new MermaidDiagramRenderer(),
                new MermaidDiagramComplexityAnalyzer(),
                new MermaidDiagramDeterministicRepairer(),
                new MermaidDiagramStructuralValidator()));

        Mock<IBrandedDiagramExportService> brandedDiagramExportService = new();
        brandedDiagramExportService
            .Setup(service => service.DecorateMermaidSourceForExportAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<BrandingDisplayContext>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid _, string source, BrandingDisplayContext _, CancellationToken _) => source);

        brandedDiagramExportService
            .Setup(service => service.WrapRenderedPngForExportAsync(
                It.IsAny<Guid>(),
                It.IsAny<byte[]>(),
                It.IsAny<BrandingDisplayContext>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid _, byte[]? png, BrandingDisplayContext _, CancellationToken _) => png);

        return new InfraEvidenceSnapshotMermaidService(
            new AzureInventorySnapshotGraphResolver(repository),
            new DiagramAstFromGraphCompiler(),
            pipeline,
            brandedDiagramExportService.Object,
            new NullDiagramImageRenderer(),
            thresholds);
    }

    private static AzureInventorySnapshotDetailReadModel BuildSnapshot(int resourceCount)
    {
        List<AzureInventoryResourceRecord> resources = [];
        List<AzureInventoryResourceRelationshipReadModel> relationships = [];

        for (int index = 0; index < resourceCount; index++)
        {
            Guid cloudResourceId = Guid.Parse($"11111111-2222-3333-4444-{index:D12}");
            string armId =
                $"/subscriptions/sub/resourceGroups/rg-network/providers/Microsoft.Network/virtualNetworks/resource-{index}";

            resources.Add(new AzureInventoryResourceRecord
            {
                ResourceRowId = Guid.NewGuid(),
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                CloudResourceId = cloudResourceId,
                AzureResourceId = armId,
                ResourceType = "Microsoft.Network/virtualNetworks",
                ResourceGroup = "rg-network",
                SubscriptionId = "sub",
            });

            if (index > 0)
            {
                string priorArmId =
                    $"/subscriptions/sub/resourceGroups/rg-network/providers/Microsoft.Network/virtualNetworks/resource-{index - 1}";

                relationships.Add(new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = priorArmId,
                    ToAzureResourceId = armId,
                    RelationshipType = "connects",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                });
            }
        }

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources = resources,
            Relationships = relationships,
        };
    }

    private static ScopeContext CreateScope()
    {
        return new ScopeContext
        {
            TenantId = TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
    }

    private sealed class InMemorySnapshotRepository : IAzureInventorySnapshotRepository
    {
        public Dictionary<Guid, AzureInventorySnapshotDetailReadModel> Snapshots { get; } = [];

        public Task InsertHeaderAsync(AzureInventorySnapshotRecord record, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<AzureInventorySnapshotRecord?> TryGetByPackageIdAsync(
            ScopeContext scope,
            Guid packageId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<AzureInventorySnapshotRecord?>(null);

        public Task<AzureInventorySnapshotRecord?> TryGetBySnapshotIdAsync(
            ScopeContext scope,
            Guid snapshotId,
            CancellationToken cancellationToken = default)
        {
            if (Snapshots.TryGetValue(snapshotId, out AzureInventorySnapshotDetailReadModel? snapshot))
            {
                return Task.FromResult<AzureInventorySnapshotRecord?>(snapshot.Header);
            }

            return Task.FromResult<AzureInventorySnapshotRecord?>(null);
        }

        public Task<AzureInventorySnapshotDetailReadModel?> TryGetSnapshotDetailAsync(
            ScopeContext scope,
            Guid snapshotId,
            CancellationToken cancellationToken = default)
        {
            if (Snapshots.TryGetValue(snapshotId, out AzureInventorySnapshotDetailReadModel? snapshot))
            {
                return Task.FromResult<AzureInventorySnapshotDetailReadModel?>(snapshot);
            }

            return Task.FromResult<AzureInventorySnapshotDetailReadModel?>(null);
        }

        public Task MaterializeSnapshotAsync(
            ScopeContext scope,
            Guid snapshotId,
            AzureInventorySnapshotMaterializeWriteRequest writeRequest,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<Guid?> TryGetPriorMaterializedSnapshotIdAsync(
            ScopeContext scope,
            string subscriptionId,
            Guid newerSnapshotId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<Guid?>(null);

        public Task<(IReadOnlyList<AzureInventorySnapshotRecord> Items, int TotalCount)> ListSnapshotsAsync(
            ScopeContext scope,
            int page,
            int pageSize,
            string? subscriptionId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<(IReadOnlyList<AzureInventorySnapshotRecord>, int)>(([], 0));
    }

    private sealed class NullDiagramImageRenderer : ArchLucid.Core.Diagrams.IDiagramImageRenderer
    {
        public Task<byte[]?> RenderMermaidPngAsync(string mermaidDiagram, CancellationToken cancellationToken = default)
            => Task.FromResult<byte[]?>(null);
    }
}
