using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;
using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventorySnapshotPublicIpParentEdgePolicyTests
{
    private const string Prefix = "/subscriptions/sub/resourcegroups/rg/providers/microsoft.network/";
    private const string PublicIp = Prefix + "publicipaddresses/pip";
    private static readonly Guid Declaration = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    public static IEnumerable<object[]> Scenarios => new[] { "nic", "lb", "appgw", "nat", "vpn" }
        .SelectMany(kind => new[] { "normal", "missing", "redacted", "blank", "malformed", "duplicate", "reverse" }
            .Select(mode => new object[] { kind + ":" + mode }));

    [Theory]
    [MemberData(nameof(Scenarios))]
    public async Task Exposure_edges_preserve_parent_direction_and_nullable_evidence(string scenario)
    {
        string mode = scenario.Split(':')[1];
        GraphSnapshot graph = await ResolveScenarioAsync(scenario);
        GraphEdge[] exposures = graph.Edges.Where(edge => edge.EdgeType == GraphEdgeTypes.Exposes).ToArray();
        Assert.Equal(mode is "missing" or "redacted" or "blank" or "malformed" ? 0 : mode == "reverse" ? 2 : 1, exposures.Length);
        if (exposures.Length == 0) return;
        GraphEdge edge = Assert.Single(exposures, edge => graph.Nodes.Single(node => node.NodeId == edge.FromNodeId).SourceId == PublicIp);
        Assert.Equal(Parent(scenario.Split(':')[0]), graph.Nodes.Single(node => node.NodeId == edge.ToNodeId).SourceId);
        Assert.Equal(mode == "duplicate" ? "explicit-first" : GraphEdgeInferenceSources.InventoryPublicIp, edge.InferenceSource);
        Assert.Equal(mode == "duplicate" ? nameof(ProvenanceKind.DeterministicInference) : null, edge.ProvenanceKind);
        Assert.Equal(mode == "duplicate" ? Declaration.ToString() : null, edge.DeclaredConnectionId);
        Assert.Equal(GraphEdgeTypes.Exposes, edge.Label);
        Assert.Equal(1d, edge.Weight);
        Assert.Equal($"edge-{edge.FromNodeId}|{edge.ToNodeId}|{GraphEdgeTypes.Exposes}", edge.EdgeId);
        if (mode == "reverse")
        {
            GraphEdge reverse = Assert.Single(exposures, candidate => candidate.FromNodeId == edge.ToNodeId);
            Assert.Equal(edge.FromNodeId, reverse.ToNodeId);
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
    public void Existing_duplicate_keeps_original_object_and_metadata(string? provenance)
    {
        GraphEdge original = new()
        {
            EdgeId = "original", FromNodeId = "pip", ToNodeId = "parent", EdgeType = GraphEdgeTypes.Exposes,
            Label = "custom", Weight = 0.42d, InferenceSource = "custom-source", ProvenanceKind = provenance,
            DeclaredConnectionId = Declaration.ToString(), ReasoningTrace = "original explanation",
        };
        original.Properties["evidence"] = "kept";
        List<GraphEdge> edges = [original];
        HashSet<string> keys = new(StringComparer.Ordinal) { "pip|parent|EXPOSES" };
        Hydrate(NodeMap(), edges, keys);
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
    public void Repeated_hydration_keeps_one_edge_with_unset_provenance()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        Hydrate(NodeMap(), edges, keys);
        GraphEdge original = Assert.Single(edges);
        Hydrate(NodeMap(), edges, keys);
        Assert.Same(original, Assert.Single(edges));
        Assert.Single(keys);
        Assert.Null(original.ProvenanceKind);
    }

    [Fact]
    public void Key_without_edge_prevents_insertion()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal) { "pip|parent|EXPOSES" };
        Hydrate(NodeMap(), edges, keys);
        Assert.Empty(edges);
        Assert.Single(keys);
    }

    [Fact]
    public void Self_reference_adds_no_edge_or_key()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        Hydrate(new(StringComparer.OrdinalIgnoreCase) { [PublicIp] = "same", [Parent("nic")] = "same" }, edges, keys);
        Assert.Empty(edges);
        Assert.Empty(keys);
    }

    [Fact]
    public void Related_children_remain_targets_alongside_exact_parent()
    {
        Dictionary<string, string> map = NodeMap();
        map[Parent("nic") + "/ipconfigurations/config"] = "child";
        List<GraphEdge> edges = [];
        Hydrate(map, edges, new(StringComparer.Ordinal));
        Assert.Equal(new[] { "child", "parent" }, edges.Select(edge => edge.ToNodeId).OrderBy(id => id));
        Assert.All(edges, edge => Assert.Null(edge.ProvenanceKind));
    }

    [Fact]
    public void Missing_exact_parent_retains_ancestor_fallback()
    {
        List<GraphEdge> edges = [];
        Dictionary<string, string> map = new(StringComparer.OrdinalIgnoreCase)
        {
            [PublicIp] = "pip", [Prefix + "widgets/owner"] = "ancestor",
        };
        var snapshot = Snapshot("nic:normal", Prefix + "widgets/owner/parts/part/ipConfigurations/config");
        AzureInventorySnapshotPublicIpParentEdgeHydrator.AddMissingParentEdges(snapshot, map, edges, new(StringComparer.Ordinal));
        Assert.Equal("ancestor", Assert.Single(edges).ToNodeId);
    }

    [Fact]
    public void Other_shared_appender_callers_still_default_to_observed_fact()
    {
        List<GraphEdge> edges = [];
        AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, new(StringComparer.Ordinal), "from", "to", GraphEdgeTypes.Exposes, "source");
        Assert.Equal(nameof(ProvenanceKind.ObservedFact), Assert.Single(edges).ProvenanceKind);
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
        }, snapshot.Header.SnapshotId, includeNeverShowArmTypes: true);
        Assert.True(result.Succeeded);
        return result.Graph!;
    }

    private static void Hydrate(Dictionary<string, string> map, List<GraphEdge> edges, HashSet<string> keys) =>
        AzureInventorySnapshotPublicIpParentEdgeHydrator.AddMissingParentEdges(Snapshot("nic:normal"), map, edges, keys);

    private static Dictionary<string, string> NodeMap() => new(StringComparer.OrdinalIgnoreCase) { [PublicIp] = "pip", [Parent("nic")] = "parent" };

    private static string Parent(string kind) => Prefix + (kind switch
    {
        "nic" => "networkinterfaces/nic",
        "lb" => "loadbalancers/lb",
        "appgw" => "applicationgateways/appgw",
        "nat" => "natgateways/nat",
        "vpn" => "virtualnetworkgateways/vpn",
        _ => throw new ArgumentOutOfRangeException(nameof(kind)),
    });

    private static AzureInventorySnapshotDetailReadModel Snapshot(string scenario, string? parentReference = null)
    {
        string kind = scenario.Split(':')[0];
        string mode = scenario.Split(':')[1];
        string parent = Parent(kind);
        Guid publicIpRow = Guid.Parse("00000000-0000-0000-0000-000000000002");
        List<AzureInventoryResourceRecord> resources = [new()
        {
            ResourceRowId = publicIpRow, AzureResourceId = PublicIp,
            ResourceType = "Microsoft.Network/publicIPAddresses", ResourceGroup = "rg", SubscriptionId = "sub",
        }];
        if (mode != "missing") resources.Insert(0, new()
        {
            ResourceRowId = Guid.Parse("00000000-0000-0000-0000-000000000001"), AzureResourceId = parent,
            ResourceType = "Microsoft.Network/" + parent[Prefix.Length..].Split('/')[0], ResourceGroup = "rg", SubscriptionId = "sub",
        });
        return new()
        {
            Header = new()
            {
                SnapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                SubscriptionId = "sub", CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
                CreatedUtc = new DateTime(2026, 10, 10, 0, 0, 0, DateTimeKind.Utc),
            },
            Resources = resources,
            Properties = [new()
            {
                ResourceRowId = publicIpRow, PropertyKey = kind == "nat" ? "NATGATEWAY.ID" : "IPCONFIGURATION.ID",
                PropertyValue = parentReference ?? (mode == "blank" ? " " : mode == "malformed" ? "not-an-arm-reference" :
                    (kind == "nat" ? parent : parent + (kind == "lb" ? "/frontendIPConfigurations/config" : "/ipConfigurations/config")).ToUpperInvariant()),
                IsRedacted = mode == "redacted",
            }],
            Relationships = mode is "duplicate" or "reverse" ? [new()
            {
                FromAzureResourceId = mode == "reverse" ? parent : PublicIp,
                ToAzureResourceId = mode == "reverse" ? PublicIp : parent,
                RelationshipType = GraphEdgeTypes.Exposes, InferenceSource = "explicit-first",
                ProvenanceKind = ProvenanceKind.DeterministicInference, DeclaredConnectionId = Declaration,
            }] : [],
        };
    }
}
