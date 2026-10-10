using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventorySnapshotMetadataIndexPolicyTests
{
    private const string Prefix = "/subscriptions/sub/resourcegroups/rg/providers/";
    private const string Target = Prefix + "microsoft.compute/virtualmachines/vm";
    private static readonly Guid Row = Guid.Parse("00000000-0000-0000-0000-000000000001");

    public static IEnumerable<object[]> Scenarios => new[] { "connection", "restore" }
        .SelectMany(type => new[] { "current", "configured", "observed", "missing" }.Select(currency => new object[] { type + ":" + currency }));

    [Theory]
    [MemberData(nameof(Scenarios))]
    public async Task Metadata_uses_first_normalized_arm_node_and_retains_evidence_currency(string scenario)
    {
        GraphSnapshot graph = await ResolveScenarioAsync(scenario);
        GraphNode first = graph.Nodes[0];
        GraphNode second = graph.Nodes[1];
        Assert.Equal(3, second.Properties.Count);
        string currency = scenario.Split(':')[1];
        string metadataKey = scenario.StartsWith("connection:", StringComparison.Ordinal)
            ? InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint1ArmId : InventoryDiagramParentAttachmentPropertyKeys.RestorePointSourceArmId;
        Assert.Equal(Target, first.Properties[metadataKey]);
        string currencyKey = scenario.StartsWith("connection:", StringComparison.Ordinal)
            ? InventoryDiagramNodeRelationshipPropertyKeys.EvidenceCurrency : InventoryDiagramParentAttachmentPropertyKeys.EvidenceCurrency;
        if (currency == "missing") Assert.False(first.Properties.ContainsKey(currencyKey));
        else Assert.Equal(currency == "current" ? "Current" : currency == "configured" ? "Configured" : "Observed", first.Properties[currencyKey]);
        Assert.Equal("first", first.Properties["marker"]);
        Assert.Equal("second", second.Properties["marker"]);
    }

    [Fact]
    public void Duplicate_unredacted_property_keys_keep_existing_exception_policy()
    {
        var (snapshot, nodes) = Fixture("connection:current");
        var duplicate = new AzureInventorySnapshotDetailReadModel
        {
            Header = snapshot.Header, Resources = snapshot.Resources,
            Properties = snapshot.Properties.Concat([new AzureInventoryResourcePropertyReadModel { ResourceRowId = Row,
                PropertyKey = "VIRTUALNETWORKGATEWAY1.ID", PropertyValue = Target }]).ToArray(),
        };
        Assert.Throws<ArgumentException>(() => AzureInventorySnapshotNodeRelationshipGraphHydrator.Hydrate(duplicate, nodes));
        Assert.Equal("Current", nodes[0].Properties[InventoryDiagramNodeRelationshipPropertyKeys.EvidenceCurrency]);
    }

    [Fact]
    public void Redacted_duplicate_is_filtered_before_property_lookup()
    {
        var (snapshot, nodes) = Fixture("restore:current");
        var duplicate = new AzureInventorySnapshotDetailReadModel
        {
            Header = snapshot.Header, Resources = snapshot.Resources,
            Properties = snapshot.Properties.Concat([new AzureInventoryResourcePropertyReadModel { ResourceRowId = Row,
                PropertyKey = "SOURCE.ID", PropertyValue = "other", IsRedacted = true }]).ToArray(),
        };
        AzureInventorySnapshotParentAttachmentGraphHydrator.Hydrate(duplicate, nodes);
        Assert.Equal(Target, nodes[0].Properties[InventoryDiagramParentAttachmentPropertyKeys.RestorePointSourceArmId]);
    }

    [Fact]
    public void Empty_nodes_keep_all_metadata_hydrators_as_noops()
    {
        var (snapshot, _) = Fixture("connection:current");
        AzureInventorySnapshotNodeRelationshipGraphHydrator.Hydrate(snapshot, []);
        AzureInventorySnapshotParentAttachmentGraphHydrator.Hydrate(snapshot, []);
        AzureInventorySnapshotIndirectRelationshipGraphHydrator.Hydrate(snapshot, [], []);
    }

    internal static Task<GraphSnapshot> ResolveScenarioAsync(string scenario)
    {
        var (snapshot, nodes) = Fixture(scenario);
        AzureInventorySnapshotNodeRelationshipGraphHydrator.Hydrate(snapshot, nodes);
        AzureInventorySnapshotParentAttachmentGraphHydrator.Hydrate(snapshot, nodes);
        AzureInventorySnapshotIndirectRelationshipGraphHydrator.Hydrate(snapshot, nodes, []);
        return Task.FromResult(new GraphSnapshot
        {
            GraphSnapshotId = snapshot.Header.SnapshotId, CreatedUtc = snapshot.Header.CreatedUtc, Nodes = nodes, Edges = [],
        });
    }

    internal static Task<GraphSnapshot> ResolveWithSharedIndexesAsync(string scenario)
    {
        var (snapshot, nodes) = Fixture(scenario);
        AzureInventorySnapshotGraphIndexes indexes = AzureInventorySnapshotGraphIndexes.Create(snapshot, nodes);
        AzureInventorySnapshotNodeRelationshipGraphHydrator.Hydrate(snapshot, nodes, indexes);
        AzureInventorySnapshotParentAttachmentGraphHydrator.Hydrate(snapshot, nodes, indexes);
        AzureInventorySnapshotIndirectRelationshipGraphHydrator.Hydrate(snapshot, nodes, [], indexes);
        return Task.FromResult(new GraphSnapshot
        {
            GraphSnapshotId = snapshot.Header.SnapshotId, CreatedUtc = snapshot.Header.CreatedUtc, Nodes = nodes, Edges = [],
        });
    }

    private static (AzureInventorySnapshotDetailReadModel Snapshot, List<GraphNode> Nodes) Fixture(string scenario)
    {
        bool connection = scenario.StartsWith("connection:", StringComparison.Ordinal);
        string type = connection ? "Microsoft.Network/connections" : "Microsoft.Compute/restorePointCollections";
        string owner = Prefix + (connection ? "microsoft.network/connections/connection" : "microsoft.compute/restorepointcollections/restore");
        GraphNode Node(string id, string armId, string sourceId) => new()
        {
            NodeId = id, NodeType = GraphNodeTypes.TopologyResource, Label = id, Category = "azure", SourceId = sourceId, SourceType = "azure-inventory-snapshot",
            Properties = new(StringComparer.Ordinal) { ["arm.id"] = armId, ["arm.type"] = type },
        };
        GraphNode first = Node("first", owner, owner);
        GraphNode second = Node("second", owner.ToUpperInvariant(), "duplicate:" + owner);
        first.Properties["marker"] = "first";
        second.Properties["marker"] = "second";
        GraphNode target = Node("target", Target, Target);
        target.Properties["arm.type"] = "Microsoft.Compute/virtualMachines";
        var snapshot = new AzureInventorySnapshotDetailReadModel
        {
            Header = new() { SnapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                CreatedUtc = new DateTime(2026, 10, 10, 0, 0, 0, DateTimeKind.Utc) },
            Resources = [new() { ResourceRowId = Row, AzureResourceId = owner, ResourceType = type,
                SourceEvidenceReference = scenario.Split(':')[1] switch { "current" => "snapshot:source", "configured" => "terraform:source", "observed" => "logs:source", _ => null } }],
            Properties = [new() { ResourceRowId = Row, PropertyKey = connection ? "virtualNetworkGateway1.id" : "source.id", PropertyValue = Target },
                new() { ResourceRowId = Row, PropertyKey = "ignored", PropertyValue = " ", IsRedacted = true }],
        };
        return (snapshot, [first, second, target]);
    }
}
