using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;
using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventorySnapshotGraphResolverTargetPolicyTests
{
    private const string Source = "/subscriptions/sub/resourcegroups/rg/providers/microsoft.storage/storageaccounts/source";
    private const string Server = "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/server";
    private const string Database = Server + "/databases/app";
    private const string Identity = "/subscriptions/sub/resourcegroups/rg/providers/microsoft.managedidentity/userassignedidentities/identity";
    private const string RemoteVnet = "/subscriptions/remote/resourcegroups/rg/providers/microsoft.network/virtualnetworks/remote";
    private static readonly Guid Declaration = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    public static IEnumerable<object[]> Scenarios => new[] { "exact", "exact-with-children", "children-only", "ancestor", "missing", "hidden-collected", "hidden-absent", "hidden-included", "invalid", "peering", "external" }.Select(name => new object[] { name });

    [Theory]
    [MemberData(nameof(Scenarios))]
    public async Task Relationship_targets_preserve_mappings_placeholders_visibility_and_evidence(string scenario)
    {
        GraphSnapshot graph = await ResolveScenarioAsync(scenario);
        string sourceType = scenario == "external" ? "Microsoft.DataFactory/factories" : scenario == "peering" ? "Microsoft.Network/virtualNetworks" : "Microsoft.Storage/storageAccounts";
        GraphNode source = Assert.Single(graph.Nodes, node => node.Properties.GetValueOrDefault("arm.type") == sourceType && node.SourceId != RemoteVnet);
        string edgeType = scenario == "peering" ? GraphEdgeTypes.PeersWith : GraphEdgeTypes.DependsOn;
        GraphEdge[] targets = graph.Edges.Where(edge => edge.FromNodeId == source.NodeId && edge.EdgeType == edgeType).ToArray();
        string[] expectedIds = scenario switch
        {
            "exact" or "ancestor" or "missing" => [Server],
            "exact-with-children" => [Server, Database, Server + "/databases/second"],
            "children-only" => [Database, Server + "/databases/second"],
            "hidden-included" => [Identity],
            "peering" => [RemoteVnet],
            _ => [],
        };
        if (scenario == "external")
        {
            GraphEdge target = Assert.Single(targets);
            GraphNode external = Assert.Single(graph.Nodes, node => node.NodeId == target.ToNodeId);
            Assert.True(AzureInventoryAdfExternalSourceNodeFactory.IsExternalSourceNodeId(external.NodeId));
        }
        else
        {
            Assert.Equal(expectedIds.Order(StringComparer.Ordinal), targets.Select(edge => graph.Nodes.Single(node => node.NodeId == edge.ToNodeId).SourceId!).Order(StringComparer.Ordinal));
        }
        foreach (GraphEdge edge in targets)
        {
            Assert.Equal(nameof(ProvenanceKind.ObservedFact), edge.ProvenanceKind);
            Assert.Equal("explicit-target", edge.InferenceSource);
            Assert.Equal(Declaration.ToString(), edge.DeclaredConnectionId);
            Assert.Equal(1d, edge.Weight);
            Assert.Equal(edgeType, edge.Label);
        }
        if (scenario == "missing")
        {
            GraphNode placeholder = Assert.Single(graph.Nodes, node => node.Properties.ContainsKey("inventory.collectionStatus"));
            Assert.Equal(Server, placeholder.SourceId);
            Assert.Equal("referenced-not-collected", placeholder.Properties["inventory.collectionStatus"]);
        }
        else
        {
            Assert.DoesNotContain(graph.Nodes, node => node.Properties.ContainsKey("inventory.collectionStatus"));
        }
        if (scenario == "peering")
            Assert.Equal("remote-vnet", graph.Nodes.Single(node => node.SourceId == RemoteVnet).Properties["arm.stub"]);
        if (scenario is "hidden-collected" or "hidden-absent")
            Assert.DoesNotContain(graph.Nodes, node => node.SourceId == Identity);
    }

    internal static async Task<GraphSnapshot> ResolveScenarioAsync(string scenario)
    {
        string source = scenario == "external" ? "/subscriptions/sub/resourcegroups/rg/providers/microsoft.datafactory/factories/factory"
            : scenario == "peering" ? "/subscriptions/sub/resourcegroups/rg/providers/microsoft.network/virtualnetworks/local" : Source;
        string target = scenario.StartsWith("hidden-", StringComparison.Ordinal) ? Identity : scenario == "ancestor" ? Database
            : scenario == "invalid" ? "invalid-arm-id" : scenario == "peering" ? RemoteVnet : Server;
        List<AzureInventoryResourceRecord> resources = [Resource(source, scenario == "external" ? "Microsoft.DataFactory/factories" : scenario == "peering" ? "Microsoft.Network/virtualNetworks" : "Microsoft.Storage/storageAccounts", 1)];
        if (scenario is "exact" or "exact-with-children" or "ancestor") resources.Add(Resource(Server, "Microsoft.Sql/servers", 2));
        if (scenario is "exact-with-children" or "children-only")
        {
            resources.Add(Resource(Database, "Microsoft.Sql/servers/databases", 3));
            resources.Add(Resource(Server + "/databases/second", "Microsoft.Sql/servers/databases", 4));
        }
        if (scenario is "hidden-collected" or "hidden-included") resources.Add(Resource(Identity, "Microsoft.ManagedIdentity/userAssignedIdentities", 2));
        List<AzureInventoryAdfExternalSourceReadModel> external = [];
        if (scenario == "external")
        {
            target = AzureInventoryAdfExternalSourceNodeFactory.BuildNodeKey(source, "remote-service");
            external.Add(new AzureInventoryAdfExternalSourceReadModel { ExternalNodeKey = target, FactoryResourceId = source, LinkedServiceName = "remote-service", LinkedServiceType = "Http", TargetHost = "external.example" });
        }
        Guid snapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord { SnapshotId = snapshotId, TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), SubscriptionId = "sub", CaptureStatus = AzureInventoryCaptureStatus.Succeeded, CreatedUtc = new DateTime(2026, 10, 10, 0, 0, 0, DateTimeKind.Utc) },
            Resources = resources,
            Relationships = [new AzureInventoryResourceRelationshipReadModel { FromAzureResourceId = source, ToAzureResourceId = target, RelationshipType = scenario == "peering" ? GraphEdgeTypes.PeersWith : GraphEdgeTypes.DependsOn, ProvenanceKind = ProvenanceKind.ObservedFact, InferenceSource = "explicit-target", DeclaredConnectionId = Declaration }],
            AdfExternalSources = external,
        };
        Mock<IAzureInventorySnapshotRepository> repo = new(MockBehavior.Strict);
        repo.Setup(repository => repository.TryGetCanonicalSnapshotDetailAsync(It.IsAny<ScopeContext>(), snapshotId, It.IsAny<CancellationToken>())).ReturnsAsync(snapshot);
        var result = await new AzureInventorySnapshotGraphResolver(repo.Object).TryResolveGraphAsync(new ScopeContext { TenantId = snapshot.Header.TenantId, WorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"), ProjectId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee") }, snapshotId, includeNeverShowArmTypes: scenario == "hidden-included");
        Assert.True(result.Succeeded);
        return result.Graph!;
    }

    private static AzureInventoryResourceRecord Resource(string id, string type, int ordinal) => new()
    {
        ResourceRowId = Guid.Parse($"00000000-0000-0000-0000-{ordinal:D12}"), AzureResourceId = id, ResourceType = type, ResourceGroup = "rg", SubscriptionId = "sub",
    };
}
