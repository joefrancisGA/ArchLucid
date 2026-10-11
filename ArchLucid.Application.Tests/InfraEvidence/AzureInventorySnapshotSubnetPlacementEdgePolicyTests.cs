using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;
using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventorySnapshotSubnetPlacementEdgePolicyTests
{
    private const string Prefix = "/subscriptions/sub/resourcegroups/rg/providers/";
    private const string Subnet = Prefix + "microsoft.network/virtualnetworks/vnet/subnets/app";
    private static readonly Guid OwnerRow = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private static readonly Guid Declaration = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private sealed record Placement(string SourceId, string SourceType, string TargetId, string TargetType, string EdgeType, string InferenceSource, string PropertyKey);

    public static IEnumerable<object[]> Scenarios => new[] { "nic", "private-endpoint", "app-service", "subnet-nsg", "subnet-routes" }
        .SelectMany(kind => new[] { "normal", "duplicate", "ancestor", "missing" }.Select(mode => new object[] { kind + ":" + mode }))
        .Concat(new[] { "nic:fanout", "nic:self", "subnet-nsg:malformed", "subnet-routes:malformed" }.Select(name => new object[] { name }));

    [Theory]
    [MemberData(nameof(Scenarios))]
    public async Task Placement_edges_preserve_targets_first_duplicate_and_observed_metadata(string scenario)
    {
        Placement placement = ReadPlacement(scenario.Split(':')[0]);
        string mode = scenario.Split(':')[1];
        GraphSnapshot graph = await ResolveScenarioAsync(scenario);
        GraphEdge[] edges = graph.Edges.Where(edge => edge.EdgeType == placement.EdgeType).ToArray();
        Assert.Equal(mode is "missing" or "self" or "malformed" ? 0 : mode == "fanout" ? 3 : 1, edges.Length);
        string target = mode == "ancestor" ? AncestorTarget(placement) : placement.TargetId;
        string[] expectedTargets = edges.Length == 0 ? [] : mode == "fanout"
            ? [target, target + "/serviceAssociationLinks/one", target + "/serviceAssociationLinks/two"] : [target];
        Assert.Equal(expectedTargets.Order(StringComparer.Ordinal), edges.Select(edge => graph.Nodes.Single(node => node.NodeId == edge.ToNodeId).SourceId!).Order(StringComparer.Ordinal));
        foreach (GraphEdge edge in edges)
        {
            Assert.Equal(placement.SourceId, graph.Nodes.Single(node => node.NodeId == edge.FromNodeId).SourceId);
            Assert.Equal(mode == "duplicate" ? nameof(ProvenanceKind.DeterministicInference) : nameof(ProvenanceKind.ObservedFact), edge.ProvenanceKind);
            Assert.Equal(mode == "duplicate" ? "explicit-first" : placement.InferenceSource, edge.InferenceSource);
            Assert.Equal(mode == "duplicate" ? Declaration.ToString() : null, edge.DeclaredConnectionId);
            Assert.Equal(placement.EdgeType, edge.Label);
            Assert.Equal(1d, edge.Weight);
            Assert.Equal($"edge-{edge.FromNodeId}|{edge.ToNodeId}|{edge.EdgeType}", edge.EdgeId);
        }
        Assert.DoesNotContain(graph.Nodes, node => node.Properties.ContainsKey("inventory.collectionStatus"));
    }

    [Theory]
    [InlineData("ObservedFact")]
    [InlineData("HumanAssertion")]
    [InlineData("DerivedFact")]
    [InlineData("DeterministicInference")]
    [InlineData("unknown")]
    [InlineData(null)]
    [InlineData(" ")]
    public void Hydration_keeps_existing_edge_object_and_all_evidence_even_when_provenance_is_weaker(string? provenance)
    {
        Placement placement = ReadPlacement("nic");
        GraphEdge existing = new()
        {
            EdgeId = "original-id", FromNodeId = "source", ToNodeId = "target", EdgeType = placement.EdgeType,
            Label = "original-label", Weight = 0.42d, InferenceSource = "original-source",
            ProvenanceKind = provenance, DeclaredConnectionId = Declaration.ToString(),
        };
        existing.Properties["evidence"] = "original-evidence";
        List<GraphEdge> edges = [existing];
        HashSet<string> keys = new(StringComparer.Ordinal) { $"source|target|{placement.EdgeType}" };
        AzureInventorySnapshotSubnetPlacementEdgeHydrator.AddMissingPlacementEdges(
            CreateSnapshot("nic:normal"), NodeMap(placement), edges, keys);
        Assert.Same(existing, Assert.Single(edges));
        Assert.Single(keys);
        Assert.Equal("original-id", existing.EdgeId);
        Assert.Equal("original-label", existing.Label);
        Assert.Equal(0.42d, existing.Weight);
        Assert.Equal("original-source", existing.InferenceSource);
        Assert.Equal(provenance, existing.ProvenanceKind);
        Assert.Equal(Declaration.ToString(), existing.DeclaredConnectionId);
        Assert.Equal("original-evidence", existing.Properties["evidence"]);
    }

    [Fact]
    public void Existing_key_without_edge_still_prevents_placement_insertion()
    {
        Placement placement = ReadPlacement("nic");
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal) { $"source|target|{placement.EdgeType}" };
        AzureInventorySnapshotSubnetPlacementEdgeHydrator.AddMissingPlacementEdges(CreateSnapshot("nic:normal"), NodeMap(placement), edges, keys);
        Assert.Empty(edges);
        Assert.Single(keys);
    }

    internal static async Task<GraphSnapshot> ResolveScenarioAsync(string scenario)
    {
        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot(scenario);
        Mock<IAzureInventorySnapshotRepository> repo = new(MockBehavior.Strict);
        repo.Setup(repository => repository.TryGetCanonicalSnapshotDetailAsync(It.IsAny<ScopeContext>(), snapshot.Header.SnapshotId, It.IsAny<CancellationToken>())).ReturnsAsync(snapshot);
        var result = await new AzureInventorySnapshotGraphResolver(repo.Object).TryResolveGraphAsync(new ScopeContext
        {
            TenantId = snapshot.Header.TenantId, WorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ProjectId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        }, snapshot.Header.SnapshotId, includeNeverShowArmTypes: true);
        Assert.True(result.Succeeded);
        return result.Graph!;
    }

    private static AzureInventorySnapshotDetailReadModel CreateSnapshot(string scenario)
    {
        Placement placement = ReadPlacement(scenario.Split(':')[0]);
        string mode = scenario.Split(':')[1];
        string citedTarget = mode == "self" ? placement.SourceId : mode == "ancestor" && placement.PropertyKey == "subnets"
            ? placement.TargetId + "/childItems/item" : placement.TargetId;
        string collectedTarget = mode == "ancestor" ? AncestorTarget(placement) : placement.TargetId;
        string collectedType = mode == "ancestor" && placement.PropertyKey != "subnets" ? "Microsoft.Network/virtualNetworks" : placement.TargetType;
        List<AzureInventoryResourceRecord> resources = [Resource(placement.SourceId, placement.SourceType, 1)];
        if (mode is not "missing" and not "self")
            resources.Add(Resource(collectedTarget, collectedType, 2));
        // Collected subnets include their VNet so diagram group membership has a real parent.
        if (placement.PropertyKey != "subnets" && mode is "normal" or "duplicate" or "fanout")
            resources.Add(Resource(Prefix + "microsoft.network/virtualnetworks/vnet", "Microsoft.Network/virtualNetworks", 5));
        if (mode == "fanout")
        {
            resources.Add(Resource(placement.TargetId + "/serviceAssociationLinks/one", "Microsoft.Network/virtualNetworks/subnets/serviceAssociationLinks", 3));
            resources.Add(Resource(placement.TargetId + "/serviceAssociationLinks/two", "Microsoft.Network/virtualNetworks/subnets/serviceAssociationLinks", 4));
        }
        string value = placement.PropertyKey != "subnets" ? citedTarget
            : "[{\"properties\":{\"" + (placement.TargetType.Contains("networkSecurityGroups", StringComparison.Ordinal) ? "networkSecurityGroup" : "routeTable") + "\":{\"id\":\"" + citedTarget + "\"}}}]";
        List<AzureInventoryResourceRelationshipReadModel> relationships = [];
        if (mode == "duplicate")
            relationships.Add(new AzureInventoryResourceRelationshipReadModel
            {
                FromAzureResourceId = placement.SourceId, ToAzureResourceId = placement.TargetId, RelationshipType = placement.EdgeType,
                InferenceSource = "explicit-first", ProvenanceKind = ProvenanceKind.DeterministicInference, DeclaredConnectionId = Declaration,
            });
        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                SubscriptionId = "sub", CaptureStatus = AzureInventoryCaptureStatus.Succeeded, CreatedUtc = new DateTime(2026, 10, 10, 0, 0, 0, DateTimeKind.Utc),
            },
            Resources = resources, Relationships = relationships,
            Properties = [new AzureInventoryResourcePropertyReadModel { ResourceRowId = OwnerRow, PropertyKey = placement.PropertyKey, PropertyValue = mode == "malformed" ? "not-json" : value }],
        };
    }

    private static string AncestorTarget(Placement placement) => placement.PropertyKey == "subnets" ? placement.TargetId
        : Prefix + "microsoft.network/virtualnetworks/vnet";

    private static Dictionary<string, string> NodeMap(Placement placement) => new(StringComparer.OrdinalIgnoreCase)
    {
        [placement.SourceId] = "source", [placement.TargetId] = "target",
    };

    private static AzureInventoryResourceRecord Resource(string id, string type, int ordinal) => new()
    {
        ResourceRowId = Guid.Parse($"00000000-0000-0000-0000-{ordinal:D12}"), AzureResourceId = id,
        ResourceType = type, ResourceGroup = "rg", SubscriptionId = "sub",
    };

    private static Placement ReadPlacement(string kind) => kind switch
    {
        "nic" => new(Prefix + "microsoft.network/networkinterfaces/source", "Microsoft.Network/networkInterfaces", Subnet, "Microsoft.Network/virtualNetworks/subnets", "nicToSubnet", GraphEdgeInferenceSources.InventoryNicSubnet, "ipConfiguration.subnet.id[0]"),
        "private-endpoint" => new(Prefix + "microsoft.network/privateendpoints/source", "Microsoft.Network/privateEndpoints", Subnet, "Microsoft.Network/virtualNetworks/subnets", "peToSubnet", GraphEdgeInferenceSources.InventoryPeSubnet, "subnet.id"),
        "app-service" => new(Prefix + "microsoft.web/sites/source", "Microsoft.Web/sites", Subnet, "Microsoft.Network/virtualNetworks/subnets", "appServiceToSubnet", GraphEdgeInferenceSources.InventoryAppServiceSubnet, "virtualNetworkSubnetId"),
        "subnet-nsg" => new(Prefix + "microsoft.network/virtualnetworks/vnet", "Microsoft.Network/virtualNetworks", Prefix + "microsoft.network/networksecuritygroups/nsg", "Microsoft.Network/networkSecurityGroups", GraphEdgeTypes.AppliesTo, GraphEdgeInferenceSources.InventorySubnetNsg, "subnets"),
        "subnet-routes" => new(Prefix + "microsoft.network/virtualnetworks/vnet", "Microsoft.Network/virtualNetworks", Prefix + "microsoft.network/routetables/routes", "Microsoft.Network/routeTables", GraphEdgeTypes.AppliesTo, GraphEdgeInferenceSources.InventorySubnetRouteTable, "subnets"),
        _ => throw new ArgumentOutOfRangeException(nameof(kind)),
    };
}
