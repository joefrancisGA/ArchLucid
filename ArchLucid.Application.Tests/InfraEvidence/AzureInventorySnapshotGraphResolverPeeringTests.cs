using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
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
public sealed class AzureInventorySnapshotGraphResolverPeeringTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

    [Fact]
    public async Task TryResolveGraphAsync_hydrates_peering_from_nested_vnet_property()
    {
        Guid rowA = Guid.Parse("11111111-1111-4000-8000-000000000001");
        Guid rowB = Guid.Parse("11111111-1111-4000-8000-000000000002");
        const string vnetA =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a";
        const string vnetB =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [
                CreateVnet(rowA, vnetA),
                CreateVnet(rowB, vnetB),
            ],
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = rowA,
                    PropertyKey = AzureInventoryVnetPeeringParser.PeeringsPropertyKey,
                    PropertyValue = BuildPeeringsJson(vnetB),
                },
            ],
            []);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().ContainSingle(edge =>
            edge.EdgeType == GraphEdgeTypes.PeersWith
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryVnetPeering);
    }

    [Fact]
    public async Task TryResolveGraphAsync_hydrates_peering_from_child_peering_resource()
    {
        Guid vnetRow = Guid.Parse("22222222-1111-4000-8000-000000000001");
        Guid peerRow = Guid.Parse("22222222-1111-4000-8000-000000000002");
        Guid remoteRow = Guid.Parse("22222222-1111-4000-8000-000000000003");
        const string vnetA =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a";
        const string vnetB =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";
        const string peeringId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a/virtualNetworkPeerings/peer-to-b";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [
                CreateVnet(vnetRow, vnetA),
                CreateVnet(remoteRow, vnetB),
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = peerRow,
                    SnapshotId = SnapshotId,
                    TenantId = TenantId,
                    AzureResourceId = peeringId,
                    ResourceType = "Microsoft.Network/virtualNetworks/virtualNetworkPeerings",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                    ParentResourceId = vnetA,
                },
            ],
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = peerRow,
                    PropertyKey = AzureInventoryVnetPeeringParser.RemoteVirtualNetworkIdPropertyKey,
                    PropertyValue = vnetB,
                },
            ],
            []);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().ContainSingle(edge => edge.EdgeType == GraphEdgeTypes.PeersWith);
        result.Graph.Nodes.Should().NotContain(node =>
            string.Equals(node.Properties["arm.type"], "Microsoft.Network/virtualNetworks/virtualNetworkPeerings", StringComparison.Ordinal));
        result.Graph.Nodes.Should().HaveCount(2);
    }

    [Fact]
    public async Task TryResolveGraphAsync_does_not_duplicate_existing_peering_relationship()
    {
        Guid rowA = Guid.Parse("33333333-1111-4000-8000-000000000001");
        Guid rowB = Guid.Parse("33333333-1111-4000-8000-000000000002");
        const string vnetA =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a";
        const string vnetB =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [
                CreateVnet(rowA, vnetA),
                CreateVnet(rowB, vnetB),
            ],
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = rowA,
                    PropertyKey = AzureInventoryVnetPeeringParser.PeeringsPropertyKey,
                    PropertyValue = BuildPeeringsJson(vnetB),
                },
            ],
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = vnetA,
                    ToAzureResourceId = vnetB,
                    RelationshipType = GraphEdgeTypes.PeersWith,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                    InferenceSource = GraphEdgeInferenceSources.InventoryVnetPeering,
                },
            ]);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Where(edge => edge.EdgeType == GraphEdgeTypes.PeersWith).Should().ContainSingle();
    }

    [Fact]
    public async Task TryResolveGraphAsync_stubs_peering_when_remote_vnet_is_not_in_snapshot()
    {
        Guid rowA = Guid.Parse("44444444-1111-4000-8000-000000000001");
        const string vnetA =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a";
        const string missingRemote =
            "/subscriptions/other/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/hub";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [CreateVnet(rowA, vnetA)],
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = rowA,
                    PropertyKey = AzureInventoryVnetPeeringParser.PeeringsPropertyKey,
                    PropertyValue = BuildPeeringsJson(missingRemote),
                },
            ],
            []);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Nodes.Should().HaveCount(2);
        result.Graph.Nodes.Should().Contain(node =>
            string.Equals(node.Properties.GetValueOrDefault("arm.stub"), "remote-vnet", StringComparison.Ordinal));
        result.Graph.Edges.Should().ContainSingle(edge => edge.EdgeType == GraphEdgeTypes.PeersWith);
    }

    [Fact]
    public async Task TryResolveGraphAsync_copies_bastion_subnet_and_vnet_subnets_properties()
    {
        Guid bastionRow = Guid.Parse("44444444-1111-4000-8000-000000000001");
        Guid vnetRow = Guid.Parse("44444444-1111-4000-8000-000000000002");
        const string bastionId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/bastionHosts/bastion1";
        const string vnetId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1";
        const string subnetId = vnetId + "/subnets/AzureBastionSubnet";

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(
            CreateSnapshot(
                [
                    new AzureInventoryResourceRecord
                    {
                        ResourceRowId = bastionRow,
                        SnapshotId = SnapshotId,
                        TenantId = TenantId,
                        AzureResourceId = bastionId,
                        ResourceType = "Microsoft.Network/bastionHosts",
                        ResourceGroup = "rg",
                        SubscriptionId = "sub",
                    },
                    CreateVnet(vnetRow, vnetId),
                ],
                [
                    new AzureInventoryResourcePropertyReadModel
                    {
                        ResourceRowId = bastionRow,
                        PropertyKey = "ipConfiguration.subnet.id[0]",
                        PropertyValue = subnetId,
                    },
                    new AzureInventoryResourcePropertyReadModel
                    {
                        ResourceRowId = vnetRow,
                        PropertyKey = "subnets",
                        PropertyValue = "[{\"id\":\"" + subnetId + "\"}]",
                    },
                ],
                []));

        result.Succeeded.Should().BeTrue();
        GraphNode bastion = result.Graph!.Nodes.Single(node => node.Properties["arm.id"] == bastionId);
        GraphNode vnet = result.Graph.Nodes.Single(node => node.Properties["arm.id"] == vnetId);

        bastion.Properties["ipConfiguration.subnet.id[0]"].Should().Be(subnetId);
        vnet.Properties["subnets"].Should().Contain(subnetId);
        InventoryDiagramConnectionStateResult classification =
            InventoryDiagramOrphanedStateClassifier.Classify(bastion, result.Graph, false);
        classification.State.Should().NotBe(InventoryDiagramConnectionState.Orphaned);
        classification.MissingRequirementMessage.Should().BeNull();
    }

    [Fact]
    public async Task TryResolveGraphAsync_copies_firewall_ip_configurations_onto_the_graph()
    {
        Guid firewallRow = Guid.Parse("66666666-1111-4000-8000-000000000001");
        Guid vnetRow = Guid.Parse("66666666-1111-4000-8000-000000000002");
        const string firewallId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";
        const string vnetId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1";
        const string subnetId = vnetId + "/subnets/AzureFirewallSubnet";
        string ipConfigurations =
            "[{\"properties\":{\"subnet\":{\"id\":\"" + subnetId + "\"}}}]";

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(
            CreateSnapshot(
                [
                    new AzureInventoryResourceRecord
                    {
                        ResourceRowId = firewallRow,
                        SnapshotId = SnapshotId,
                        TenantId = TenantId,
                        AzureResourceId = firewallId,
                        ResourceType = "Microsoft.Network/azureFirewalls",
                        ResourceGroup = "rg",
                        SubscriptionId = "sub",
                    },
                    CreateVnet(vnetRow, vnetId),
                ],
                [
                    new AzureInventoryResourcePropertyReadModel
                    {
                        ResourceRowId = firewallRow,
                        PropertyKey = "ipConfigurations",
                        PropertyValue = ipConfigurations,
                    },
                    new AzureInventoryResourcePropertyReadModel
                    {
                        ResourceRowId = vnetRow,
                        PropertyKey = "subnets",
                        PropertyValue = "[{\"id\":\"" + subnetId + "\"}]",
                    },
                ],
                []));

        result.Succeeded.Should().BeTrue();
        GraphNode firewall = result.Graph!.Nodes.Single(node => node.Properties["arm.id"] == firewallId);
        GraphNode vnet = result.Graph.Nodes.Single(node => node.Properties["arm.id"] == vnetId);

        firewall.Properties["ipConfigurations"].Should().Contain(subnetId);
        vnet.Properties["subnets"].Should().Contain(subnetId);
        result.Graph.Nodes.Should().NotContain(node =>
            (node.Properties.GetValueOrDefault("arm.type") ?? string.Empty)
                .Contains("virtualNetworks/subnets", StringComparison.OrdinalIgnoreCase));
        InventoryDiagramConnectionStateResult classification =
            InventoryDiagramOrphanedStateClassifier.Classify(firewall, result.Graph, false);
        classification.State.Should().NotBe(InventoryDiagramConnectionState.Orphaned);
        classification.MissingRequirementMessage.Should().NotContain("is not in this inventory snapshot");
    }

    [Fact]
    public async Task TryResolveGraphAsync_copies_public_ip_ip_configuration_id()
    {
        Guid publicIpRow = Guid.Parse("55555555-1111-4000-8000-000000000001");
        Guid nicRow = Guid.Parse("55555555-1111-4000-8000-000000000002");
        const string publicIpId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip1";
        const string nicId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1";
        const string ipConfigurationId = nicId + "/ipConfigurations/ipconfig1";

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(
            CreateSnapshot(
                [
                    new AzureInventoryResourceRecord
                    {
                        ResourceRowId = publicIpRow,
                        SnapshotId = SnapshotId,
                        TenantId = TenantId,
                        AzureResourceId = publicIpId,
                        ResourceType = "Microsoft.Network/publicIPAddresses",
                        ResourceGroup = "rg",
                        SubscriptionId = "sub",
                    },
                    new AzureInventoryResourceRecord
                    {
                        ResourceRowId = nicRow,
                        SnapshotId = SnapshotId,
                        TenantId = TenantId,
                        AzureResourceId = nicId,
                        ResourceType = "Microsoft.Network/networkInterfaces",
                        ResourceGroup = "rg",
                        SubscriptionId = "sub",
                    },
                ],
                [
                    new AzureInventoryResourcePropertyReadModel
                    {
                        ResourceRowId = publicIpRow,
                        PropertyKey = "ipConfiguration.id",
                        PropertyValue = ipConfigurationId,
                    },
                ],
                []));

        result.Succeeded.Should().BeTrue();
        GraphNode publicIp = result.Graph!.Nodes.Single(node => node.Properties["arm.id"] == publicIpId);

        publicIp.Properties["ipConfiguration.id"].Should().Be(ipConfigurationId);
        InventoryDiagramConnectionStateResult classification =
            InventoryDiagramOrphanedStateClassifier.Classify(publicIp, result.Graph, false);
        classification.State.Should().NotBe(InventoryDiagramConnectionState.Orphaned);
        classification.MissingRequirementMessage.Should().NotContain("no IP configuration or parent reference");
    }

    [Fact]
    public async Task TryResolveGraphAsync_leaves_public_ip_without_ip_configuration_id_unhydrated()
    {
        Guid publicIpRow = Guid.Parse("66666666-1111-4000-8000-000000000001");
        const string publicIpId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/unattached";

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(
            CreateSnapshot(
                [
                    new AzureInventoryResourceRecord
                    {
                        ResourceRowId = publicIpRow,
                        SnapshotId = SnapshotId,
                        TenantId = TenantId,
                        AzureResourceId = publicIpId,
                        ResourceType = "Microsoft.Network/publicIPAddresses",
                        ResourceGroup = "rg",
                        SubscriptionId = "sub",
                    },
                ],
                [],
                []));

        result.Succeeded.Should().BeTrue();
        GraphNode publicIp = result.Graph!.Nodes.Single(node => node.Properties["arm.id"] == publicIpId);

        publicIp.Properties.ContainsKey("ipConfiguration.id").Should().BeFalse();
    }

    [Fact]
    public async Task Executive_mermaid_renders_owner_shape_peerings_from_vnet_properties_only()
    {
        (int from, int to)[] peerings =
        [
            (0, 5),
            (1, 6),
            (2, 7),
            (3, 8),
            (4, 9),
            (5, 10),
        ];

        List<AzureInventoryResourceRecord> resources = [];
        List<AzureInventoryResourcePropertyReadModel> properties = [];

        for (int index = 0; index < 11; index++)
        {
            Guid rowId = Guid.Parse($"66666666-1111-4000-8000-{index:D12}");
            string armId =
                $"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-{index:D2}";
            resources.Add(CreateVnet(rowId, armId));
        }

        foreach ((int from, int to) in peerings)
        {
            string remoteArmId =
                $"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-{to:D2}";
            properties.Add(new AzureInventoryResourcePropertyReadModel
            {
                ResourceRowId = resources[from].ResourceRowId,
                PropertyKey = AzureInventoryVnetPeeringParser.PeeringsPropertyKey,
                PropertyValue = BuildPeeringsJson(remoteArmId),
            });
        }

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(resources, properties, []);
        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Where(edge => edge.EdgeType == GraphEdgeTypes.PeersWith).Should().HaveCount(6);

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(
            result.Graph,
            DiagramMode.Executive);
        string mermaid = new MermaidDiagramRenderer().Render(ast);

        ast.Nodes.Should().HaveCount(11);
        ast.Edges.Count(edge => !edge.IsLayoutOnly).Should().Be(6);
        mermaid.Should().Contain("-->|\"peering\"|");
    }

    [Fact]
    public async Task Executive_mermaid_labels_hydrated_vnet_peering_edges()
    {
        Guid rowA = Guid.Parse("55555555-1111-4000-8000-000000000001");
        Guid rowB = Guid.Parse("55555555-1111-4000-8000-000000000002");
        const string vnetA =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/spoke-a";
        const string vnetB =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/spoke-b";

        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(
            [
                CreateVnet(rowA, vnetA),
                CreateVnet(rowB, vnetB),
            ],
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = rowA,
                    PropertyKey = AzureInventoryVnetPeeringParser.PeeringsPropertyKey,
                    PropertyValue = BuildPeeringsJson(vnetB),
                },
            ],
            []);

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(snapshot);

        result.Succeeded.Should().BeTrue();

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(
            result.Graph!,
            DiagramMode.Executive);
        string mermaid = new MermaidDiagramRenderer().Render(ast);

        ast.Edges.Should().Contain(edge => !edge.IsLayoutOnly && edge.Label == "peering");
        mermaid.Should().Contain("-->|\"peering\"|");
        mermaid.Should().Contain("spoke-a");
        mermaid.Should().Contain("spoke-b");
    }

    private static async Task<AzureInventorySnapshotGraphResolveResult> ResolveAsync(
        AzureInventorySnapshotDetailReadModel snapshot)
    {
        Mock<IAzureInventorySnapshotRepository> repository = new();
        repository
            .Setup(candidate => candidate.TryGetSnapshotDetailAsync(
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

    private static string BuildPeeringsJson(string remoteVnetId)
    {
        return "[{\"properties\":{\"remoteVirtualNetwork\":{\"id\":\"" + remoteVnetId + "\"}}}]";
    }

    private static AzureInventoryResourceRecord CreateVnet(Guid resourceRowId, string azureResourceId)
    {
        return new AzureInventoryResourceRecord
        {
            ResourceRowId = resourceRowId,
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            AzureResourceId = azureResourceId,
            ResourceType = "Microsoft.Network/virtualNetworks",
            ResourceGroup = "rg",
            SubscriptionId = "sub",
        };
    }
}
