using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventoryPrivateEndpointTargetResolutionTests
{
    private const string Pe = "/subscriptions/sub/resourcegroups/rg/providers/microsoft.network/privateendpoints/pe";
    private const string Server = "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql";
    private const string Database = Server + "/databases/app";
    private const string Identity = "/subscriptions/sub/resourcegroups/rg/providers/microsoft.managedidentity/userassignedidentities/identity";

    [Theory]
    [InlineData("exact")]
    [InlineData("ancestor")]
    [InlineData("children")]
    [InlineData("hidden-collected")]
    [InlineData("hidden-collected-included")]
    [InlineData("hidden-absent")]
    [InlineData("hidden-absent-included")]
    [InlineData("missing")]
    [InlineData("invalid")]
    [InlineData("redacted")]
    public void Target_policy_preserves_resolution_visibility_and_placeholder_identity(string scenario)
    {
        string target = scenario.StartsWith("hidden-absent", StringComparison.Ordinal) ? Identity
            : scenario == "ancestor" ? Database : scenario == "invalid" ? "invalid-arm-id" : Server;
        Dictionary<string, string> mappings = new(StringComparer.OrdinalIgnoreCase) { [Pe] = "pe" };
        string[] expectedTargets = [];
        switch (scenario)
        {
            case "exact":
            case "hidden-collected-included":
                mappings[Server] = "server";
                expectedTargets = ["server"];
                break;
            case "ancestor":
                mappings[Server] = "server";
                expectedTargets = ["server"];
                break;
            case "children":
                mappings[Database] = "database";
                mappings[Server + "/databases/second"] = "second";
                expectedTargets = ["database", "second"];
                break;
            case "hidden-collected":
                mappings[Server] = "server";
                break;
        }
        List<GraphNode> nodes = mappings.Select(pair => new GraphNode
        {
            NodeId = pair.Value, SourceId = pair.Key, NodeType = GraphNodeTypes.TopologyResource,
            Label = pair.Value, SourceType = "azure-inventory-snapshot",
        }).ToList();
        HashSet<string> seen = new(nodes.Select(node => node.NodeId), StringComparer.Ordinal);
        HashSet<string> collected = new(mappings.Keys, StringComparer.OrdinalIgnoreCase);
        HashSet<string> hidden = new(StringComparer.OrdinalIgnoreCase);
        if (scenario.StartsWith("hidden-collected", StringComparison.Ordinal)) hidden.Add(Server);
        bool includeHidden = scenario.EndsWith("-included", StringComparison.Ordinal);
        int initialNodeCount = nodes.Count;
        Guid ownerRowId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord(),
            Resources = [new AzureInventoryResourceRecord
            {
                ResourceRowId = ownerRowId, AzureResourceId = Pe, ResourceType = "Microsoft.Network/privateEndpoints",
            }],
            Properties = [new AzureInventoryResourcePropertyReadModel
            {
                ResourceRowId = ownerRowId, PropertyKey = "privateLinkServiceId", PropertyValue = target,
                IsRedacted = scenario == "redacted",
            }],
        };
        List<GraphEdge> edges = [];
        HashSet<string> edgeKeys = new(StringComparer.Ordinal);

        void Hydrate() => AzureInventorySnapshotPrivateEndpointEdgeHydrator.AddMissingTargetEdges(
            snapshot, mappings, nodes, seen, edges, edgeKeys, collected, hidden, includeHidden, retainIdentityDiagramArmTypes: false);

        Hydrate();
        string[] firstNodeIds = nodes.Select(node => node.NodeId).ToArray();
        string[] firstEdgeIds = edges.Select(edge => edge.EdgeId).ToArray();
        Hydrate();
        Assert.Equal(firstNodeIds, nodes.Select(node => node.NodeId));
        Assert.Equal(firstEdgeIds, edges.Select(edge => edge.EdgeId));

        bool placeholderExpected = scenario is "missing" or "hidden-absent-included";
        if (placeholderExpected)
        {
            GraphNode placeholder = Assert.Single(nodes, node => node.Properties.ContainsKey("inventory.collectionStatus"));
            Assert.Equal(target, placeholder.SourceId);
            Assert.Equal("referenced-not-collected", placeholder.Properties["inventory.collectionStatus"]);
            Assert.Equal("referenced-resource", placeholder.Properties["arm.stub"]);
            Assert.Equal(initialNodeCount + 1, nodes.Count);
            expectedTargets = [placeholder.NodeId];
        }
        else
        {
            Assert.Equal(initialNodeCount, nodes.Count);
            Assert.DoesNotContain(nodes, node => node.Properties.ContainsKey("inventory.collectionStatus"));
        }
        Assert.Equal(expectedTargets.Order(StringComparer.Ordinal), edges.Select(edge => edge.ToNodeId).Order(StringComparer.Ordinal));
        Assert.Equal(expectedTargets.Length, edgeKeys.Count);
        foreach (GraphEdge edge in edges)
        {
            Assert.Equal("pe", edge.FromNodeId);
            Assert.Equal(AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget, edge.EdgeType);
            Assert.Equal(nameof(ProvenanceKind.DeterministicInference), edge.ProvenanceKind);
            Assert.Equal(GraphEdgeInferenceSources.InventoryPrivateEndpoint, edge.InferenceSource);
            Assert.Equal("privateLinkServiceId", edge.Properties["evidence.propertyKey"]);
            Assert.Equal(ownerRowId.ToString("D"), edge.Properties["evidence.resourceRowId"]);
            Assert.Equal(target, edge.Properties["evidence.targetArmId"]);
        }
    }
}
