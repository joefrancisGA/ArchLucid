using System.Text.Json;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;
using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventorySnapshotVnetPeeringEdgePolicyTests
{
    private const string Local = "/subscriptions/sub/resourcegroups/rg/providers/microsoft.network/virtualnetworks/local";
    private const string Remote = "/subscriptions/remote/resourcegroups/remote-rg/providers/microsoft.network/virtualnetworks/remote";
    private static readonly Guid Declaration = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    public static IEnumerable<object[]> Scenarios => new[] { "nested", "child", "both" }
        .SelectMany(kind => new[] { "normal", "remote-missing", "reciprocal", "duplicate", "reverse", "self", "blank", "malformed" }
            .Select(mode => new object[] { kind + ":" + mode }))
        .Append(new object[] { "child:both-missing" })
        .SelectMany(row => new[] { "default", "included" }.Select(view => new object[] { row[0] + ":" + view }));

    [Theory]
    [MemberData(nameof(Scenarios))]
    public async Task Peering_edges_preserve_pair_direction_stubs_and_evidence(string scenario)
    {
        string mode = scenario.Split(':')[1];
        GraphSnapshot graph = await ResolveScenarioAsync(scenario);
        GraphEdge[] peerings = graph.Edges.Where(edge => edge.EdgeType == GraphEdgeTypes.PeersWith).ToArray();
        if (mode is "self" or "blank" or "malformed")
        {
            Assert.Empty(peerings);
            Assert.DoesNotContain(graph.Nodes, node => node.Properties.ContainsKey("arm.stub"));
            return;
        }
        bool hasChildTarget = mode == "reverse" && scenario.Split(':')[0] != "nested" && scenario.EndsWith(":included", StringComparison.Ordinal);
        Assert.Equal(hasChildTarget ? 2 : 1, peerings.Length);
        GraphEdge edge = Assert.Single(peerings, candidate => graph.Nodes.Single(node => node.NodeId == candidate.ToNodeId).SourceId == (mode == "reverse" ? Local : Remote));
        Assert.Equal(mode == "reverse" ? Remote : Local, graph.Nodes.Single(node => node.NodeId == edge.FromNodeId).SourceId);
        Assert.Equal(mode == "reverse" ? Local : Remote, graph.Nodes.Single(node => node.NodeId == edge.ToNodeId).SourceId);
        Assert.Equal(mode is "duplicate" or "reverse" ? "explicit-first" : GraphEdgeInferenceSources.InventoryVnetPeering, edge.InferenceSource);
        Assert.Equal(mode is "duplicate" or "reverse" ? nameof(ProvenanceKind.DeterministicInference) : null, edge.ProvenanceKind);
        Assert.Equal(mode is "duplicate" or "reverse" ? Declaration.ToString() : null, edge.DeclaredConnectionId);
        Assert.Equal(GraphEdgeTypes.PeersWith, edge.Label);
        Assert.Equal(1d, edge.Weight);
        Assert.Equal($"edge-{edge.FromNodeId}|{edge.ToNodeId}|{GraphEdgeTypes.PeersWith}", edge.EdgeId);
        if (hasChildTarget)
        {
            GraphEdge childTarget = Assert.Single(peerings, candidate => candidate != edge);
            Assert.Equal(edge.FromNodeId, childTarget.FromNodeId);
            Assert.Equal(Local + "/virtualnetworkpeerings/peer", graph.Nodes.Single(node => node.NodeId == childTarget.ToNodeId).SourceId);
            Assert.Equal(edge.InferenceSource, childTarget.InferenceSource);
            Assert.Equal(edge.ProvenanceKind, childTarget.ProvenanceKind);
            Assert.Equal(edge.DeclaredConnectionId, childTarget.DeclaredConnectionId);
        }
        GraphNode[] stubs = graph.Nodes.Where(node => node.Properties.ContainsKey("arm.stub")).ToArray();
        Assert.Equal(mode == "both-missing" ? 2 : mode == "remote-missing" ? 1 : 0, stubs.Length);
        Assert.All(stubs, node => Assert.Equal("remote-vnet", node.Properties["arm.stub"]));
        if (mode == "remote-missing") Assert.Equal(Remote, Assert.Single(stubs).SourceId);
    }

    public static IEnumerable<object[]> ExistingEvidenceCases => new string?[]
        { "ObservedFact", "HumanAssertion", "DerivedFact", "DeterministicInference", "unknown", null, " " }
        .SelectMany(provenance => new[] { false, true }.Select(reverse => new object[] { provenance!, reverse }));

    [Theory]
    [MemberData(nameof(ExistingEvidenceCases))]
    public void Existing_pair_keeps_original_object_and_all_metadata(string? provenance, bool reverse)
    {
        string from = reverse ? "remote" : "local";
        string to = reverse ? "local" : "remote";
        GraphEdge original = new()
        {
            EdgeId = "original", FromNodeId = from, ToNodeId = to, EdgeType = GraphEdgeTypes.PeersWith,
            Label = "custom", Weight = 0.42d, InferenceSource = "custom-source", ProvenanceKind = provenance,
            DeclaredConnectionId = Declaration.ToString(), ReasoningTrace = "original explanation",
        };
        original.Properties["evidence"] = "kept";
        List<GraphEdge> edges = [original];
        HashSet<string> keys = new(StringComparer.Ordinal) { $"{from}|{to}|{GraphEdgeTypes.PeersWith}" };
        Hydrate(NodeMap(), [], new(StringComparer.Ordinal), edges, keys);
        Assert.Same(original, Assert.Single(edges));
        Assert.Single(keys);
        Assert.Equal("original", original.EdgeId);
        Assert.Equal("custom", original.Label);
        Assert.Equal(0.42d, original.Weight);
        Assert.Equal("custom-source", original.InferenceSource);
        Assert.Equal(provenance, original.ProvenanceKind);
        Assert.Equal(Declaration.ToString(), original.DeclaredConnectionId);
        Assert.Equal("original explanation", original.ReasoningTrace);
        Assert.Equal("kept", original.Properties["evidence"]);
    }

    [Fact]
    public void Existing_pair_with_different_edge_type_casing_still_suppresses_insertion()
    {
        GraphEdge original = new() { FromNodeId = "remote", ToNodeId = "local", EdgeType = "peers_with" };
        List<GraphEdge> edges = [original];
        HashSet<string> keys = new(StringComparer.Ordinal);
        Hydrate(NodeMap(), [], new(StringComparer.Ordinal), edges, keys);
        Assert.Same(original, Assert.Single(edges));
        Assert.Empty(keys);
    }

    [Fact]
    public void Directed_key_without_edge_prevents_insertion()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal) { "local|remote|PEERS_WITH" };
        Hydrate(NodeMap(), [], new(StringComparer.Ordinal), edges, keys);
        Assert.Empty(edges);
        Assert.Single(keys);
    }

    [Fact]
    public void Repeated_hydration_keeps_edge_and_remote_stub_objects()
    {
        Dictionary<string, string> map = new(StringComparer.OrdinalIgnoreCase) { [Local] = "local" };
        List<GraphNode> nodes = [];
        List<GraphEdge> edges = [];
        HashSet<string> seen = new(StringComparer.Ordinal);
        HashSet<string> keys = new(StringComparer.Ordinal);
        Hydrate(map, nodes, seen, edges, keys);
        GraphEdge edge = Assert.Single(edges);
        GraphNode stub = Assert.Single(nodes);
        Hydrate(map, nodes, seen, edges, keys);
        Assert.Same(edge, Assert.Single(edges));
        Assert.Same(stub, Assert.Single(nodes));
        Assert.Single(seen);
        Assert.Single(keys);
        Assert.Null(edge.ProvenanceKind);
    }

    [Fact]
    public void Existing_stub_can_be_reindexed_without_adding_a_duplicate_node()
    {
        Dictionary<string, string> map = new(StringComparer.OrdinalIgnoreCase) { [Local] = "local" };
        List<GraphNode> nodes = [];
        List<GraphEdge> edges = [];
        HashSet<string> seen = new(StringComparer.Ordinal);
        HashSet<string> keys = new(StringComparer.Ordinal);
        Hydrate(map, nodes, seen, edges, keys);
        GraphNode stub = Assert.Single(nodes);
        map.Remove(Remote);
        edges.Clear();
        keys.Clear();
        Hydrate(map, nodes, seen, edges, keys);
        Assert.Same(stub, Assert.Single(nodes));
        Assert.Equal(stub.NodeId, map[Remote]);
        Assert.Equal(stub.NodeId, Assert.Single(edges).ToNodeId);
    }

    [Fact]
    public void Unrelated_edge_between_same_nodes_does_not_suppress_peering()
    {
        GraphEdge unrelated = new() { FromNodeId = "local", ToNodeId = "remote", EdgeType = GraphEdgeTypes.DependsOn };
        List<GraphEdge> edges = [unrelated];
        Hydrate(NodeMap(), [], new(StringComparer.Ordinal), edges, new(StringComparer.Ordinal));
        Assert.Equal(2, edges.Count);
        Assert.Same(unrelated, edges[0]);
        Assert.Equal(GraphEdgeTypes.PeersWith, edges[1].EdgeType);
    }

    internal static async Task<GraphSnapshot> ResolveScenarioAsync(string scenario)
    {
        var snapshot = Snapshot(scenario);
        Mock<IAzureInventorySnapshotRepository> repository = new(MockBehavior.Strict);
        repository.Setup(repo => repo.TryGetCanonicalSnapshotDetailAsync(It.IsAny<ScopeContext>(), snapshot.Header.SnapshotId, It.IsAny<CancellationToken>())).ReturnsAsync(snapshot);
        var result = await new AzureInventorySnapshotGraphResolver(repository.Object).TryResolveGraphAsync(new ScopeContext
        {
            TenantId = snapshot.Header.TenantId, WorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ProjectId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        }, snapshot.Header.SnapshotId, includeNeverShowArmTypes: scenario.EndsWith(":included", StringComparison.Ordinal));
        Assert.True(result.Succeeded);
        return result.Graph!;
    }

    private static Dictionary<string, string> NodeMap() => new(StringComparer.OrdinalIgnoreCase) { [Local] = "local", [Remote] = "remote" };

    private static void Hydrate(Dictionary<string, string> map, List<GraphNode> nodes, HashSet<string> seen, List<GraphEdge> edges, HashSet<string> keys) =>
        AzureInventorySnapshotVnetPeeringEdgeHydrator.AddMissingPeeringEdges(Snapshot("nested:normal"), map, nodes, seen, edges, keys);

    private static AzureInventorySnapshotDetailReadModel Snapshot(string scenario)
    {
        string kind = scenario.Split(':')[0];
        string mode = scenario.Split(':')[1];
        List<AzureInventoryResourceRecord> resources = [];
        List<AzureInventoryResourcePropertyReadModel> properties = [];
        if (mode != "both-missing") resources.Add(Resource(Local, "Microsoft.Network/virtualNetworks", 1));
        if (mode is not "remote-missing" and not "both-missing") resources.Add(Resource(Remote, "Microsoft.Network/virtualNetworks", 2));
        AddPeering(Local, mode == "self" ? Local : Remote, 1, 3);
        if (mode == "reciprocal") AddPeering(Remote, Local, 2, 4);
        return new()
        {
            Header = new()
            {
                SnapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                SubscriptionId = "sub", CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
                CreatedUtc = new DateTime(2026, 10, 10, 0, 0, 0, DateTimeKind.Utc),
            },
            Resources = resources, Properties = properties,
            Relationships = mode is "duplicate" or "reverse" ? [new()
            {
                FromAzureResourceId = mode == "reverse" ? Remote : Local,
                ToAzureResourceId = mode == "reverse" ? Local : Remote,
                RelationshipType = GraphEdgeTypes.PeersWith, InferenceSource = "explicit-first",
                ProvenanceKind = ProvenanceKind.DeterministicInference, DeclaredConnectionId = Declaration,
            }] : [],
        };

        void AddPeering(string local, string target, int ownerOrdinal, int childOrdinal)
        {
            if (kind is "nested" or "both") properties.Add(new()
            {
                ResourceRowId = RowId(ownerOrdinal), PropertyKey = "VIRTUALNETWORKPEERINGS",
                PropertyValue = mode == "blank" ? " " : mode == "malformed" ? "{broken" : JsonSerializer.Serialize(new[]
                {
                    new { properties = new { remoteVirtualNetwork = new { id = target.ToUpperInvariant() } } },
                    new { properties = new { remoteVirtualNetwork = new { id = target } } },
                }),
            });
            if (kind is "child" or "both")
            {
                resources.Add(Resource(local + "/virtualnetworkpeerings/peer", "Microsoft.Network/virtualNetworks/virtualNetworkPeerings", childOrdinal));
                properties.Add(new()
                {
                    ResourceRowId = RowId(childOrdinal),
                    PropertyKey = mode == "malformed" ? "remoteVirtualNetwork" : "REMOTEVIRTUALNETWORK.ID",
                    PropertyValue = mode == "blank" ? " " : mode == "malformed" ? "{broken" : target.ToUpperInvariant(),
                });
            }
        }
    }

    private static Guid RowId(int ordinal) => Guid.Parse($"00000000-0000-0000-0000-{ordinal:D12}");

    private static AzureInventoryResourceRecord Resource(string id, string type, int ordinal) => new()
    {
        ResourceRowId = RowId(ordinal), AzureResourceId = id, ResourceType = type,
        ResourceGroup = id.StartsWith("/subscriptions/remote/", StringComparison.Ordinal) ? "remote-rg" : "rg",
        SubscriptionId = id.StartsWith("/subscriptions/remote/", StringComparison.Ordinal) ? "remote" : "sub",
    };
}
