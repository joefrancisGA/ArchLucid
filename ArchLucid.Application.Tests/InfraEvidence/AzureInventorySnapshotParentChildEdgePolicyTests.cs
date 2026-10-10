using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;
using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventorySnapshotParentChildEdgePolicyTests
{
    private const string Prefix = "/subscriptions/sub/resourcegroups/rg/providers/";
    private static readonly Guid Declaration = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    public static IEnumerable<object[]> Scenarios => new[] { "subnet", "database", "nested" }
        .SelectMany(kind => new[] { "normal", "missing", "duplicate", "reverse" }.Select(mode => new object[] { kind + ":" + mode }));

    [Theory]
    [MemberData(nameof(Scenarios))]
    public async Task Contains_edges_preserve_direction_exact_parent_and_first_duplicate(string scenario)
    {
        var (parent, child, _, _) = ReadResource(scenario.Split(':')[0]);
        string mode = scenario.Split(':')[1];
        GraphSnapshot graph = await ResolveScenarioAsync(scenario);
        GraphEdge[] edges = graph.Edges.Where(edge => edge.EdgeType == GraphEdgeTypes.Contains).ToArray();
        Assert.Equal(mode == "missing" ? 0 : mode == "reverse" ? 2 : 1, edges.Length);
        Assert.DoesNotContain(graph.Nodes, node => node.Properties.ContainsKey("inventory.collectionStatus"));
        if (mode == "missing") return;
        GraphEdge contains = Assert.Single(edges, edge => graph.Nodes.Single(node => node.NodeId == edge.FromNodeId).SourceId == parent);
        Assert.Equal(child, graph.Nodes.Single(node => node.NodeId == contains.ToNodeId).SourceId);
        Assert.Equal(mode == "duplicate" ? "explicit-first" : GraphEdgeInferenceSources.InventoryExplicitParentChild, contains.InferenceSource);
        Assert.Equal(mode == "duplicate" ? nameof(ProvenanceKind.DeterministicInference) : nameof(ProvenanceKind.ObservedFact), contains.ProvenanceKind);
        Assert.Equal(mode == "duplicate" ? Declaration.ToString() : null, contains.DeclaredConnectionId);
        Assert.Equal(GraphEdgeTypes.Contains, contains.Label);
        Assert.Equal(1d, contains.Weight);
        Assert.Equal($"edge-{contains.FromNodeId}|{contains.ToNodeId}|{GraphEdgeTypes.Contains}", contains.EdgeId);
        if (mode == "reverse")
        {
            GraphEdge reverse = Assert.Single(edges, edge => edge.FromNodeId == contains.ToNodeId);
            Assert.Equal(contains.FromNodeId, reverse.ToNodeId);
            Assert.Equal("explicit-first", reverse.InferenceSource);
            Assert.Equal(Declaration.ToString(), reverse.DeclaredConnectionId);
        }
    }

    [Theory]
    [InlineData("ObservedFact")]
    [InlineData("HumanAssertion")]
    [InlineData("DerivedFact")]
    [InlineData("DeterministicInference")]
    [InlineData("unknown")]
    [InlineData(null)]
    [InlineData(" ")]
    public void Existing_duplicate_keeps_original_object_and_evidence(string? provenance)
    {
        GraphEdge original = new()
        {
            EdgeId = "original", FromNodeId = "parent", ToNodeId = "child", EdgeType = GraphEdgeTypes.Contains,
            Label = "custom", Weight = 0.42d, InferenceSource = "custom-source", ProvenanceKind = provenance,
            DeclaredConnectionId = Declaration.ToString(),
        };
        original.Properties["evidence"] = "kept";
        List<GraphEdge> edges = [original];
        HashSet<string> keys = new(StringComparer.Ordinal) { "parent|child|CONTAINS" };
        AzureInventorySnapshotParentChildEdgeHydrator.AddMissingContainsEdges(NodeMap(), edges, keys);
        Assert.Same(original, Assert.Single(edges));
        Assert.Single(keys);
        Assert.Equal("original", original.EdgeId);
        Assert.Equal("custom", original.Label);
        Assert.Equal(0.42d, original.Weight);
        Assert.Equal("custom-source", original.InferenceSource);
        Assert.Equal(provenance, original.ProvenanceKind);
        Assert.Equal(Declaration.ToString(), original.DeclaredConnectionId);
        Assert.Equal("kept", original.Properties["evidence"]);
    }

    [Fact]
    public void Key_without_edge_prevents_insertion()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal) { "parent|child|CONTAINS" };
        AzureInventorySnapshotParentChildEdgeHydrator.AddMissingContainsEdges(NodeMap(), edges, keys);
        Assert.Empty(edges);
        Assert.Single(keys);
    }

    [Fact]
    public void Parent_and_child_mapped_to_same_node_add_no_edge_or_key()
    {
        var (parent, child, _, _) = ReadResource("subnet");
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        AzureInventorySnapshotParentChildEdgeHydrator.AddMissingContainsEdges(new(StringComparer.OrdinalIgnoreCase)
        {
            [parent] = "same", [child] = "same",
        }, edges, keys);
        Assert.Empty(edges);
        Assert.Empty(keys);
    }

    [Fact]
    public void Missing_immediate_parent_does_not_fall_back_to_collected_ancestor()
    {
        var (_, child, _, _) = ReadResource("nested");
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        AzureInventorySnapshotParentChildEdgeHydrator.AddMissingContainsEdges(new(StringComparer.OrdinalIgnoreCase)
        {
            [Prefix + "microsoft.custom/widgets/one"] = "ancestor", [child] = "child",
        }, edges, keys);
        Assert.Empty(edges);
        Assert.Empty(keys);
    }

    [Fact]
    public void Repeated_hydration_keeps_the_first_edge_and_single_key()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        AzureInventorySnapshotParentChildEdgeHydrator.AddMissingContainsEdges(NodeMap(), edges, keys);
        GraphEdge original = Assert.Single(edges);
        AzureInventorySnapshotParentChildEdgeHydrator.AddMissingContainsEdges(NodeMap(), edges, keys);
        Assert.Same(original, Assert.Single(edges));
        Assert.Single(keys);
        Assert.Equal("parent|child|CONTAINS", Assert.Single(keys));
        Assert.Equal(nameof(ProvenanceKind.ObservedFact), original.ProvenanceKind);
        Assert.Equal(GraphEdgeInferenceSources.InventoryExplicitParentChild, original.InferenceSource);
    }

    [Fact]
    public void Resource_group_is_not_a_resource_parent()
    {
        var (parent, _, _, _) = ReadResource("subnet");
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        AzureInventorySnapshotParentChildEdgeHydrator.AddMissingContainsEdges(new(StringComparer.OrdinalIgnoreCase)
        {
            [parent] = "vnet", ["/subscriptions/sub/resourcegroups/rg"] = "rg",
        }, edges, keys);
        Assert.Empty(edges);
        Assert.Empty(keys);
    }

    internal static async Task<GraphSnapshot> ResolveScenarioAsync(string scenario)
    {
        var (parent, child, parentType, childType) = ReadResource(scenario.Split(':')[0]);
        string mode = scenario.Split(':')[1];
        Guid snapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        List<AzureInventoryResourceRecord> resources = [Resource(child, childType, 2)];
        if (mode != "missing") resources.Insert(0, Resource(parent, parentType, 1));
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId, TenantId = tenantId, SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
                CreatedUtc = new DateTime(2026, 10, 10, 0, 0, 0, DateTimeKind.Utc),
            },
            Resources = resources,
            Relationships = mode is "duplicate" or "reverse" ? [new AzureInventoryResourceRelationshipReadModel
            {
                FromAzureResourceId = mode == "reverse" ? child : parent,
                ToAzureResourceId = mode == "reverse" ? parent : child,
                RelationshipType = GraphEdgeTypes.Contains, InferenceSource = "explicit-first",
                ProvenanceKind = ProvenanceKind.DeterministicInference, DeclaredConnectionId = Declaration,
            }] : [],
        };
        Mock<IAzureInventorySnapshotRepository> repository = new(MockBehavior.Strict);
        repository.Setup(repo => repo.TryGetCanonicalSnapshotDetailAsync(It.IsAny<ScopeContext>(), snapshotId, It.IsAny<CancellationToken>())).ReturnsAsync(snapshot);
        var result = await new AzureInventorySnapshotGraphResolver(repository.Object).TryResolveGraphAsync(new ScopeContext
        {
            TenantId = tenantId, WorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ProjectId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        }, snapshotId, includeNeverShowArmTypes: true);
        Assert.True(result.Succeeded);
        return result.Graph!;
    }

    private static Dictionary<string, string> NodeMap()
    {
        var (parent, child, _, _) = ReadResource("subnet");
        return new(StringComparer.OrdinalIgnoreCase) { [parent] = "parent", [child] = "child" };
    }

    private static AzureInventoryResourceRecord Resource(string id, string type, int ordinal) => new()
    {
        ResourceRowId = Guid.Parse($"00000000-0000-0000-0000-{ordinal:D12}"), AzureResourceId = id,
        ResourceType = type, ResourceGroup = "rg", SubscriptionId = "sub",
    };

    private static (string Parent, string Child, string ParentType, string ChildType) ReadResource(string kind) => kind switch
    {
        "subnet" => (Prefix + "microsoft.network/virtualnetworks/vnet", Prefix + "microsoft.network/virtualnetworks/vnet/subnets/app", "Microsoft.Network/virtualNetworks", "Microsoft.Network/virtualNetworks/subnets"),
        "database" => (Prefix + "microsoft.sql/servers/sql", Prefix + "microsoft.sql/servers/sql/databases/db", "Microsoft.Sql/servers", "Microsoft.Sql/servers/databases"),
        "nested" => (Prefix + "microsoft.custom/widgets/one/parts/two", Prefix + "microsoft.custom/widgets/one/parts/two/items/three", "Microsoft.Custom/widgets/parts", "Microsoft.Custom/widgets/parts/items"),
        _ => throw new ArgumentOutOfRangeException(nameof(kind)),
    };
}
