using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventorySnapshotGraphResolverPrivateEndpointTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

    [Fact]
    public async Task TryResolveGraphAsync_hydrates_private_endpoint_target_from_property()
    {
        Guid peRow = Guid.Parse("11111111-1111-4000-8000-000000000001");
        Guid mysqlRow = Guid.Parse("11111111-1111-4000-8000-000000000002");
        const string peArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pemdp-mysqlbamtest";
        const string mysqlArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DBforMySQL/flexibleServers/mysql-bam-hi-dev";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [
                CreateResource(peRow, peArmId, "Microsoft.Network/privateEndpoints"),
                CreateResource(mysqlRow, mysqlArmId, "Microsoft.DBforMySQL/flexibleServers"),
            ],
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = peRow,
                    PropertyKey = "privateLinkServiceId",
                    PropertyValue = mysqlArmId,
                },
            ],
            []);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().ContainSingle(edge =>
            edge.EdgeType == AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryPrivateEndpoint);

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(result.Graph, DiagramMode.Executive);
        DiagramForestLayoutResult svg = new DiagramForestLayoutSvgRenderer().Render(ast);

        ast.Nodes.Should().ContainSingle(node => node.Label == "mysql-bam-hi-dev");
        ast.Nodes.Single(node => node.Label == "mysql-bam-hi-dev").HasPrivateEndpointAccess.Should().BeTrue();
        ast.Nodes.Should().NotContain(node => node.Label == "pemdp-mysqlbamtest");
        svg.Svg.Should().Contain("class=\"private-endpoint-lock\"");
        svg.Svg.Should().Contain("class=\"private-endpoint-arrow\"");
    }

    [Fact]
    public async Task TryResolveGraphAsync_maps_parent_private_link_id_onto_child_resource()
    {
        Guid peRow = Guid.Parse("22222222-1111-4000-8000-000000000001");
        Guid dbRow = Guid.Parse("22222222-1111-4000-8000-000000000002");
        const string peArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-sql";
        const string serverArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql";
        const string databaseArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql/databases/app";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [
                CreateResource(peRow, peArmId, "Microsoft.Network/privateEndpoints"),
                CreateResource(dbRow, databaseArmId, "Microsoft.Sql/servers/databases"),
            ],
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = peRow,
                    PropertyKey = "privateLinkServiceId",
                    PropertyValue = serverArmId,
                },
            ],
            []);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().Contain(edge =>
            edge.EdgeType == AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget);

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(result.Graph, DiagramMode.FullSubscription);
        ast.Nodes.Single(node => node.Label == "app").HasPrivateEndpointAccess.Should().BeTrue();
        ast.Nodes.Should().NotContain(node => node.Label == "pe-sql");
    }

    [Fact]
    public async Task TryResolveGraphAsync_connects_hidden_private_endpoint_target_to_vnet_without_membership()
    {
        Guid peRow = Guid.Parse("33333333-1111-4000-8000-000000000001");
        Guid vnetRow = Guid.Parse("33333333-1111-4000-8000-000000000002");
        Guid keyVaultRow = Guid.Parse("33333333-1111-4000-8000-000000000003");
        const string peArmId =
            "/subscriptions/sub/resourceGroups/pe-rg/providers/Microsoft.Network/privateEndpoints/pe-kv";
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/network-rg/providers/Microsoft.Network/virtualNetworks/vnet-a";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/network-rg/providers/Microsoft.Network/virtualNetworks/vnet-a/subnets/private";
        const string keyVaultArmId =
            "/subscriptions/sub/resourceGroups/data-rg/providers/Microsoft.KeyVault/vaults/kv-a";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [
                CreateResource(peRow, peArmId, "Microsoft.Network/privateEndpoints"),
                CreateResource(vnetRow, vnetArmId, "Microsoft.Network/virtualNetworks"),
                CreateResource(keyVaultRow, keyVaultArmId, "Microsoft.KeyVault/vaults"),
            ],
            [],
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = peArmId,
                    ToAzureResourceId = subnetArmId,
                    RelationshipType = AzureInventoryRelationshipAssociationTypes.PeToSubnet,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                    InferenceSource = GraphEdgeInferenceSources.InventoryPeSubnet,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = peArmId,
                    ToAzureResourceId = keyVaultArmId,
                    RelationshipType = AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                    InferenceSource = GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                },
            ]);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(result.Graph!, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node => node.Label == "pe-kv");
        ast.Edges.Should().Contain(edge =>
            edge.Label == InventoryDiagramRelationshipLabelTexts.PrivateAccess
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryPrivateEndpoint);
        ast.Edges.Should().NotContain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventoryPeSubnet
            && edge.FromNodeId.Contains("kv-a", StringComparison.OrdinalIgnoreCase));
    }

    [Theory]
    [InlineData("privateLinkServiceId")]
    [InlineData("privateLinkServiceId[0]")]
    [InlineData("PRIVATELINKSERVICEID[12]")]
    public async Task Property_only_target_retains_placeholder_typed_edge_and_evidence(string key)
    {
        Guid rowId = Guid.NewGuid();
        const string peId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-a";
        const string targetId = "/subscriptions/remote/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/storage-a";
        AzureInventoryResourceRecord owner = new()
        {
            ResourceRowId = rowId, AzureResourceId = peId, ResourceType = "Microsoft.Network/privateEndpoints",
            SourceEvidenceReference = "inventory/resources.json#pe-a",
        };
        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot([owner],
            [new AzureInventoryResourcePropertyReadModel { ResourceRowId = rowId, PropertyKey = key, PropertyValue = targetId }], []);
        var graph = (await ResolveAsync(snapshot)).Graph!;
        var target = graph.Nodes.Single(node => string.Equals(node.SourceId, targetId, StringComparison.OrdinalIgnoreCase));
        target.Properties["inventory.collectionStatus"].Should().Be("referenced-not-collected");
        var edge = graph.Edges.Single(candidate => candidate.EdgeType == AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget);
        edge.ToNodeId.Should().Be(target.NodeId);
        edge.InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryPrivateEndpoint);
        edge.ProvenanceKind.Should().Be(nameof(ProvenanceKind.DeterministicInference));
        edge.Properties["evidence.propertyKey"].Should().Be(key);
        edge.Properties["evidence.resourceRowId"].Should().Be(rowId.ToString("D"));
        edge.Properties["evidence.targetArmId"].Should().Be(ArmResourceIdNormalizer.Normalize(targetId));
        edge.Properties["evidence.sourceReference"].Should().Be(owner.SourceEvidenceReference);
        graph.Edges.Should().NotContain(candidate => candidate.InferenceSource == GraphEdgeInferenceSources.InventoryPropertyArmId);
        var ast = new DiagramAstFromGraphCompiler().Compile(graph, DiagramMode.FullSubscription);
        ast.Nodes.Should().Contain(node => node.Label.Contains("Referenced; details not collected", StringComparison.Ordinal));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Redacted_private_link_property_emits_no_edge_or_placeholder(bool collected)
    {
        Guid rowId = Guid.NewGuid();
        const string peId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-a";
        const string targetId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/storage-a";
        var owner = CreateResource(rowId, peId, "Microsoft.Network/privateEndpoints");
        var resources = collected
            ? new[] { owner, CreateResource(Guid.NewGuid(), targetId, "Microsoft.Storage/storageAccounts") }
            : new[] { owner };
        var snapshot = CreateSnapshot(resources,
            [new AzureInventoryResourcePropertyReadModel { ResourceRowId = rowId, PropertyKey = "privateLinkServiceId", PropertyValue = targetId, IsRedacted = true }], []);
        var graph = (await ResolveAsync(snapshot)).Graph!;
        graph.Nodes.Should().NotContain(node => node.Properties.ContainsKey("inventory.collectionStatus"));
        graph.Edges.Should().NotContain(edge => edge.EdgeType == AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget || edge.InferenceSource == GraphEdgeInferenceSources.InventoryPropertyArmId);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Hidden_private_link_target_respects_visibility(bool collected)
    {
        Guid rowId = Guid.NewGuid();
        const string peId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-a";
        const string targetId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/identity-a";
        var owner = CreateResource(rowId, peId, "Microsoft.Network/privateEndpoints");
        var resources = collected
            ? new[] { owner, CreateResource(Guid.NewGuid(), targetId, "Microsoft.ManagedIdentity/userAssignedIdentities") }
            : new[] { owner };
        var snapshot = CreateSnapshot(resources,
            [new AzureInventoryResourcePropertyReadModel { ResourceRowId = rowId, PropertyKey = "privateLinkServiceId", PropertyValue = targetId }], []);
        var graph = (await ResolveAsync(snapshot)).Graph!;
        graph.Nodes.Should().NotContain(node => string.Equals(node.SourceId, targetId, StringComparison.OrdinalIgnoreCase));
        graph.Edges.Should().NotContain(edge => edge.EdgeType == AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget);
        var inclusive = (await ResolveAsync(snapshot, includeHidden: true)).Graph!;
        inclusive.Nodes.Should().ContainSingle(node => string.Equals(node.SourceId, targetId, StringComparison.OrdinalIgnoreCase));
        inclusive.Edges.Should().ContainSingle(edge => edge.EdgeType == AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget);
    }

    [Fact]
    public async Task Duplicate_properties_enrich_existing_explicit_edge_without_changing_provenance()
    {
        Guid rowId = Guid.NewGuid();
        const string peId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-a";
        const string targetId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/storage-a";
        var snapshot = CreateSnapshot([CreateResource(rowId, peId, "Microsoft.Network/privateEndpoints")],
            [
                new AzureInventoryResourcePropertyReadModel { ResourceRowId = rowId, PropertyKey = "privateLinkServiceId", PropertyValue = targetId },
                new AzureInventoryResourcePropertyReadModel { ResourceRowId = rowId, PropertyKey = "privateLinkServiceId[0]", PropertyValue = targetId.ToUpperInvariant() + "/" },
            ],
            [new AzureInventoryResourceRelationshipReadModel
            {
                FromAzureResourceId = peId, ToAzureResourceId = targetId,
                RelationshipType = AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget,
                ProvenanceKind = ProvenanceKind.ObservedFact, InferenceSource = "captured-association",
            }]);
        var graph = (await ResolveAsync(snapshot)).Graph!;
        graph.Edges.Should().ContainSingle();
        var edge = graph.Edges.Single();
        edge.Properties["evidence.propertyKey"].Should().Be("privateLinkServiceId");
        edge.InferenceSource.Should().Be("captured-association");
        edge.ProvenanceKind.Should().Be(nameof(ProvenanceKind.ObservedFact));
    }

    [Theory]
    [InlineData("privateLinkServiceIdNotes", "ignored")]
    [InlineData("privateLinkServiceId[]", "ignored")]
    [InlineData("privateLinkServiceId", "not-an-arm-id")]
    public async Task Non_typed_or_invalid_property_does_not_create_placeholder(string key, string value)
    {
        Guid rowId = Guid.NewGuid();
        const string peId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-a";
        string targetId = value == "ignored"
            ? "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/storage-a"
            : value;
        var snapshot = CreateSnapshot([CreateResource(rowId, peId, "Microsoft.Network/privateEndpoints")],
            [new AzureInventoryResourcePropertyReadModel { ResourceRowId = rowId, PropertyKey = key, PropertyValue = targetId }], []);
        var graph = (await ResolveAsync(snapshot)).Graph!;
        graph.Nodes.Should().NotContain(node => node.Properties.ContainsKey("inventory.collectionStatus"));
        graph.Edges.Should().NotContain(edge => edge.EdgeType == AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget);
    }

    private static async Task<AzureInventorySnapshotGraphResolveResult> ResolveAsync(
        AzureInventorySnapshotDetailReadModel snapshot,
        bool includeHidden = false)
    {
        Mock<IAzureInventorySnapshotRepository> repository = new();
        repository
            .Setup(candidate => candidate.TryGetCanonicalSnapshotDetailAsync(
                It.IsAny<ScopeContext>(),
                SnapshotId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        AzureInventorySnapshotGraphResolver resolver = new(repository.Object);

        return await resolver.TryResolveGraphAsync(
            new ScopeContext
            {
                TenantId = TenantId,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            },
            SnapshotId,
            includeNeverShowArmTypes: includeHidden,
            cancellationToken: CancellationToken.None);
    }

    private static AzureInventorySnapshotDetailReadModel CreateSnapshot(
        IReadOnlyList<AzureInventoryResourceRecord> resources,
        IReadOnlyList<AzureInventoryResourcePropertyReadModel> properties,
        IReadOnlyList<AzureInventoryResourceRelationshipReadModel> relationships)
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
            Resources = resources,
            Properties = properties,
            Relationships = relationships,
        };
    }

    private static AzureInventoryResourceRecord CreateResource(Guid resourceRowId, string azureResourceId, string resourceType)
    {
        return new AzureInventoryResourceRecord
        {
            ResourceRowId = resourceRowId,
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            AzureResourceId = azureResourceId,
            ResourceType = resourceType,
            ResourceGroup = "rg",
            SubscriptionId = "sub",
        };
    }
}
