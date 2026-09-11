using System.Reflection;

using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.Architecture;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

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
    public async Task Snapshot_with_blank_arm_id_still_renders_executive_mermaid()
    {
        AzureInventoryResourceRecord resource = new()
        {
            ResourceRowId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000001"),
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            CloudResourceId = null,
            AzureResourceId = string.Empty,
            ResourceType = "Microsoft.Network/virtualNetworks",
            ResourceGroup = "rg-network",
            SubscriptionId = "sub",
        };

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources = [resource],
        };

        InMemorySnapshotRepository repository = new() { Snapshots = { [SnapshotId] = snapshot } };
        InfraEvidenceSnapshotMermaidService service = CreateService(
            repository,
            new MermaidDiagramReadabilityThresholds());
        ScopeContext scope = CreateScope();

        InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse> result =
            await service.TryGetMermaidAsync(scope, SnapshotId, "executive", null, null, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Mode.Should().Be("executive");
    }

    [Fact]
    public async Task Snapshot_with_duplicate_cloud_resource_ids_still_renders_executive_mermaid()
    {
        Guid sharedCloudResourceId = Guid.Parse("dddddddd-eeee-ffff-0000-111111111111");
        List<AzureInventoryResourceRecord> resources =
        [
            new()
            {
                ResourceRowId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000002"),
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                CloudResourceId = sharedCloudResourceId,
                AzureResourceId =
                    "/subscriptions/sub/resourceGroups/rg-network/providers/Microsoft.Network/virtualNetworks/vnet-a",
                ResourceType = "Microsoft.Network/virtualNetworks",
                ResourceGroup = "rg-network",
                SubscriptionId = "sub",
            },
            new()
            {
                ResourceRowId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000003"),
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                CloudResourceId = sharedCloudResourceId,
                AzureResourceId =
                    "/subscriptions/sub/resourceGroups/rg-network/providers/Microsoft.Network/virtualNetworks/vnet-b",
                ResourceType = "Microsoft.Network/virtualNetworks",
                ResourceGroup = "rg-network",
                SubscriptionId = "sub",
            },
        ];

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources = resources,
        };

        InMemorySnapshotRepository repository = new() { Snapshots = { [SnapshotId] = snapshot } };
        InfraEvidenceSnapshotMermaidService service = CreateService(
            repository,
            new MermaidDiagramReadabilityThresholds());
        ScopeContext scope = CreateScope();

        InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidPreviewResponse> result =
            await service.TryGetPreviewAsync(scope, SnapshotId, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Modes.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Snapshot_with_null_arm_id_and_resource_type_still_renders_executive_mermaid()
    {
        AzureInventoryResourceRecord resource = new()
        {
            ResourceRowId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000004"),
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            CloudResourceId = null,
            ResourceGroup = "rg-network",
            SubscriptionId = "sub",
        };

        SetNullableStringProperty(resource, nameof(AzureInventoryResourceRecord.AzureResourceId), null);
        SetNullableStringProperty(resource, nameof(AzureInventoryResourceRecord.ResourceType), null);

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources = [resource],
        };

        InMemorySnapshotRepository repository = new() { Snapshots = { [SnapshotId] = snapshot } };
        InfraEvidenceSnapshotMermaidService service = CreateService(
            repository,
            new MermaidDiagramReadabilityThresholds());
        ScopeContext scope = CreateScope();

        InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse> executiveResult =
            await service.TryGetMermaidAsync(scope, SnapshotId, "executive", null, null, CancellationToken.None);

        executiveResult.Succeeded.Should().BeTrue();
        executiveResult.Value.Should().NotBeNull();
        executiveResult.Value!.Mode.Should().Be("executive");

        InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidPreviewResponse> previewResult =
            await service.TryGetPreviewAsync(scope, SnapshotId, CancellationToken.None);

        previewResult.Succeeded.Should().BeTrue();
        previewResult.Value.Should().NotBeNull();
        previewResult.Value!.Modes.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Preview_continues_other_modes_when_one_mode_render_throws()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(resourceCount: 3);
        InMemorySnapshotRepository repository = new() { Snapshots = { [SnapshotId] = snapshot } };
        InfraEvidenceSnapshotMermaidService service = CreateServiceWithThrowingNetworkCompiler(
            repository,
            new MermaidDiagramReadabilityThresholds());
        ScopeContext scope = CreateScope();

        InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidPreviewResponse> result =
            await service.TryGetPreviewAsync(scope, SnapshotId, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Value.Should().NotBeNull();

        InfraEvidenceMermaidModePreview networkPreview = result.Value!.Modes
            .Should()
            .ContainSingle(mode => mode.Mode == "network")
            .Subject;

        networkPreview.Status.Should().Be(MermaidDiagramRenderStatus.Failed.ToString());
        networkPreview.Mermaid.Should().BeNull();

        result.Value.Modes
            .Should()
            .Contain(mode => mode.Mode == "executive" && mode.Status != MermaidDiagramRenderStatus.Failed.ToString());
    }

    [Fact]
    public async Task Snapshot_graph_stamps_microsoft_network_virtual_networks_as_network_category()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(resourceCount: 2);
        InMemorySnapshotRepository repository = new() { Snapshots = { [SnapshotId] = snapshot } };
        AzureInventorySnapshotGraphResolver resolver = new(repository);
        ScopeContext scope = CreateScope();

        AzureInventorySnapshotGraphResolveResult graphResult =
            await resolver.TryResolveGraphAsync(scope, SnapshotId, CancellationToken.None);

        graphResult.Succeeded.Should().BeTrue();
        graphResult.Graph.Should().NotBeNull();
        graphResult.Graph!.Nodes.Should().OnlyContain(node => node.Category == GraphTopologyCategories.Network);
    }

    [Fact]
    public async Task Network_mode_renders_mermaid_for_virtual_network_snapshot()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(resourceCount: 3);
        InMemorySnapshotRepository repository = new() { Snapshots = { [SnapshotId] = snapshot } };
        InfraEvidenceSnapshotMermaidService service = CreateService(
            repository,
            new MermaidDiagramReadabilityThresholds());
        ScopeContext scope = CreateScope();

        InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse> result =
            await service.TryGetMermaidAsync(scope, SnapshotId, "network", null, null, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Mode.Should().Be("network");
        result.Value.Status.Should().Be(MermaidDiagramRenderStatus.Succeeded.ToString());
        result.Value.Metrics.Should().NotBeNull();
        result.Value.Metrics!.NodeCount.Should().Be(3);
        result.Value.Mermaid.Should().NotBeNullOrWhiteSpace();
        result.Value.Mermaid.Should().Contain("flowchart TD");
        result.Value.Mermaid.Should().Contain("resource-0");
        result.Value.Mermaid.Should().Contain("resource-2");
    }

    [Fact]
    public async Task Network_mode_preview_reports_nodes_for_virtual_network_snapshot()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(resourceCount: 3);
        InMemorySnapshotRepository repository = new() { Snapshots = { [SnapshotId] = snapshot } };
        InfraEvidenceSnapshotMermaidService service = CreateService(
            repository,
            new MermaidDiagramReadabilityThresholds());
        ScopeContext scope = CreateScope();

        InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidPreviewResponse> result =
            await service.TryGetPreviewAsync(scope, SnapshotId, CancellationToken.None);

        result.Succeeded.Should().BeTrue();

        InfraEvidenceMermaidModePreview networkPreview = result.Value!.Modes
            .Should()
            .ContainSingle(mode => mode.Mode == "network")
            .Subject;

        networkPreview.NodeCount.Should().Be(3);
        networkPreview.Status.Should().NotBe(MermaidDiagramRenderStatus.Failed.ToString());
        networkPreview.Mermaid.Should().NotBeNullOrWhiteSpace();
        networkPreview.Mermaid.Should().Contain("resource-0");
    }

    [Fact]
    public async Task Network_mode_excludes_storage_accounts_from_mermaid()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildMixedNetworkAndStorageSnapshot();
        InMemorySnapshotRepository repository = new() { Snapshots = { [SnapshotId] = snapshot } };
        InfraEvidenceSnapshotMermaidService service = CreateService(
            repository,
            new MermaidDiagramReadabilityThresholds());
        ScopeContext scope = CreateScope();

        InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse> result =
            await service.TryGetMermaidAsync(scope, SnapshotId, "network", null, null, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Value!.Mermaid.Should().Contain("core-vnet");
        result.Value.Mermaid.Should().NotContain("logs-storage");
    }

    [Fact]
    public async Task Identity_mode_renders_mermaid_for_managed_identity_snapshot()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildIdentitySnapshot(resourceCount: 3);
        InMemorySnapshotRepository repository = new() { Snapshots = { [SnapshotId] = snapshot } };
        InfraEvidenceSnapshotMermaidService service = CreateService(
            repository,
            new MermaidDiagramReadabilityThresholds());
        ScopeContext scope = CreateScope();

        InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse> result =
            await service.TryGetMermaidAsync(scope, SnapshotId, "identity", null, null, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Mode.Should().Be("identity");
        result.Value.Status.Should().Be(MermaidDiagramRenderStatus.Succeeded.ToString());
        result.Value.Metrics.Should().NotBeNull();
        result.Value.Metrics!.NodeCount.Should().Be(3);
        result.Value.Mermaid.Should().NotBeNullOrWhiteSpace();
        result.Value.Mermaid.Should().Contain("flowchart TD");
        result.Value.Mermaid.Should().Contain("mi-eastus-0");
        result.Value.Mermaid.Should().Contain("mi-eastus-2");
    }

    [Fact]
    public async Task Identity_mode_preview_reports_nodes_for_managed_identity_snapshot()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildIdentitySnapshot(resourceCount: 3);
        InMemorySnapshotRepository repository = new() { Snapshots = { [SnapshotId] = snapshot } };
        InfraEvidenceSnapshotMermaidService service = CreateService(
            repository,
            new MermaidDiagramReadabilityThresholds());
        ScopeContext scope = CreateScope();

        InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidPreviewResponse> result =
            await service.TryGetPreviewAsync(scope, SnapshotId, CancellationToken.None);

        result.Succeeded.Should().BeTrue();

        InfraEvidenceMermaidModePreview identityPreview = result.Value!.Modes
            .Should()
            .ContainSingle(mode => mode.Mode == "identity")
            .Subject;

        identityPreview.NodeCount.Should().Be(3);
        identityPreview.Status.Should().NotBe(MermaidDiagramRenderStatus.Failed.ToString());
        identityPreview.Mermaid.Should().NotBeNullOrWhiteSpace();
        identityPreview.Mermaid.Should().Contain("mi-eastus-0");
    }

    [Fact]
    public async Task Identity_mode_flattens_sparse_managed_identity_swimlanes_in_mermaid()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildIdentitySnapshot(resourceCount: 12);
        InMemorySnapshotRepository repository = new() { Snapshots = { [SnapshotId] = snapshot } };
        InfraEvidenceSnapshotMermaidService service = CreateService(
            repository,
            new MermaidDiagramReadabilityThresholds());
        ScopeContext scope = CreateScope();

        InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse> result =
            await service.TryGetMermaidAsync(scope, SnapshotId, "identity", null, null, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Value!.Metrics!.NodeCount.Should().Be(12);
        result.Value.Mermaid.Should().NotContain("subgraph");
        result.Value.Mermaid.Should().Contain("mi-eastus-0");
        result.Value.Mermaid.Should().Contain("mi-eastus-11");
    }

    [Fact]
    public async Task Identity_mode_excludes_storage_accounts_from_mermaid()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildMixedIdentityAndStorageSnapshot();
        InMemorySnapshotRepository repository = new() { Snapshots = { [SnapshotId] = snapshot } };
        InfraEvidenceSnapshotMermaidService service = CreateService(
            repository,
            new MermaidDiagramReadabilityThresholds());
        ScopeContext scope = CreateScope();

        InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse> result =
            await service.TryGetMermaidAsync(scope, SnapshotId, "identity", null, null, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Value!.Mermaid.Should().Contain("app-identity");
        result.Value.Mermaid.Should().NotContain("logs-storage");
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

    private static InfraEvidenceSnapshotMermaidService CreateServiceWithThrowingNetworkCompiler(
        IAzureInventorySnapshotRepository repository,
        MermaidDiagramReadabilityThresholds thresholds)
    {
        Mock<IDiagramAstFromGraphCompiler> compiler = new();
        DiagramAstFromGraphCompiler realCompiler = new();

        compiler
            .Setup(candidate => candidate.Compile(
                It.IsAny<GraphSnapshot>(),
                It.IsAny<DiagramMode>(),
                It.IsAny<DiagramAstCompileOptions?>()))
            .Returns((GraphSnapshot graph, DiagramMode mode, DiagramAstCompileOptions? options) =>
            {
                if (mode == DiagramMode.Network)
                {
                    throw new InvalidOperationException("Simulated network mode compile failure.");
                }

                return realCompiler.Compile(graph, mode, options);
            });

        return CreateService(repository, thresholds, compiler.Object);
    }

    private static InfraEvidenceSnapshotMermaidService CreateService(
        IAzureInventorySnapshotRepository repository,
        MermaidDiagramReadabilityThresholds thresholds,
        IDiagramAstFromGraphCompiler? graphCompiler = null)
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
            graphCompiler ?? new DiagramAstFromGraphCompiler(),
            pipeline,
            brandedDiagramExportService.Object,
            new NullDiagramImageRenderer(),
            new NoOpArchitectureDiagramReconciliationRepository(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            thresholds);
    }

    private static AzureInventorySnapshotDetailReadModel BuildMixedNetworkAndStorageSnapshot()
    {
        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    SnapshotId = SnapshotId,
                    TenantId = TenantId,
                    CloudResourceId = Guid.Parse("11111111-2222-3333-4444-000000000001"),
                    AzureResourceId =
                        "/subscriptions/sub/resourceGroups/rg-network/providers/Microsoft.Network/virtualNetworks/core-vnet",
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg-network",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    SnapshotId = SnapshotId,
                    TenantId = TenantId,
                    CloudResourceId = Guid.Parse("11111111-2222-3333-4444-000000000002"),
                    AzureResourceId =
                        "/subscriptions/sub/resourceGroups/rg-data/providers/Microsoft.Storage/storageAccounts/logsstorage",
                    ResourceType = "Microsoft.Storage/storageAccounts",
                    ResourceGroup = "rg-data",
                    SubscriptionId = "sub",
                },
            ],
        };
    }

    private static AzureInventorySnapshotDetailReadModel BuildMixedIdentityAndStorageSnapshot()
    {
        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    SnapshotId = SnapshotId,
                    TenantId = TenantId,
                    CloudResourceId = Guid.Parse("11111111-2222-3333-4444-000000000010"),
                    AzureResourceId =
                        "/subscriptions/sub/resourceGroups/identity-rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/app-identity",
                    ResourceType = "Microsoft.ManagedIdentity/userAssignedIdentities",
                    ResourceGroup = "identity-rg",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    SnapshotId = SnapshotId,
                    TenantId = TenantId,
                    CloudResourceId = Guid.Parse("11111111-2222-3333-4444-000000000002"),
                    AzureResourceId =
                        "/subscriptions/sub/resourceGroups/rg-data/providers/Microsoft.Storage/storageAccounts/logsstorage",
                    ResourceType = "Microsoft.Storage/storageAccounts",
                    ResourceGroup = "rg-data",
                    SubscriptionId = "sub",
                },
            ],
        };
    }

    private static AzureInventorySnapshotDetailReadModel BuildIdentitySnapshot(int resourceCount)
    {
        List<AzureInventoryResourceRecord> resources = [];
        List<AzureInventoryResourceRelationshipReadModel> relationships = [];

        for (int index = 0; index < resourceCount; index++)
        {
            Guid cloudResourceId = Guid.Parse($"11111111-2222-3333-4444-{index:D12}");
            string resourceGroup = $"identity-rg-{index}";
            string armId =
                $"/subscriptions/sub/resourceGroups/{resourceGroup}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/mi-eastus-{index}";

            resources.Add(new AzureInventoryResourceRecord
            {
                ResourceRowId = Guid.NewGuid(),
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                CloudResourceId = cloudResourceId,
                AzureResourceId = armId,
                ResourceType = "Microsoft.ManagedIdentity/userAssignedIdentities",
                ResourceGroup = resourceGroup,
                SubscriptionId = "sub",
            });

            if (index > 0)
            {
                string priorResourceGroup = $"identity-rg-{index - 1}";
                string priorArmId =
                    $"/subscriptions/sub/resourceGroups/{priorResourceGroup}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/mi-eastus-{index - 1}";

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

    private static void SetNullableStringProperty(object target, string propertyName, string? value)
    {
        PropertyInfo? property = target.GetType().GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance);

        if (property is null)
        {
            throw new InvalidOperationException($"Property '{propertyName}' was not found.");
        }

        property.SetValue(target, value);
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
