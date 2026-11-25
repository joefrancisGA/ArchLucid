using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryPrivateDnsCanReachPrivilegePathTests
{
    private const string SubscriptionId = "11111111-1111-1111-1111-111111111111";

    [Fact]
    public void Privilege_graph_includes_indeterminate_can_reach_when_dns_join_missing()
    {
        string vnet = BuildVnet("vnet-a");
        string subnet = BuildSubnet(vnet, "subnet-a");
        string app = BuildWebApp("orders-api");
        string sql = BuildSqlServer("sql1");
        string pe = BuildPrivateEndpoint("pe-sql");

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                SubscriptionId = SubscriptionId,
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources =
            [
                Resource(app, "Microsoft.Web/sites"),
                Resource(sql, "Microsoft.Sql/servers"),
                Resource(pe, "Microsoft.Network/privateEndpoints"),
            ],
            Relationships =
            [
                Relationship(app, subnet, GraphEdgeInferenceSources.InventoryAppServiceSubnet),
                Relationship(pe, sql, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
                Relationship(app, sql, GraphEdgeInferenceSources.InventoryServiceConnectorLink),
            ],
        };

        InventoryPrivilegePathGraphSnapshot graph = InventoryPrivilegePathGraph.Build(snapshot);

        string normalizedApp = ArmResourceIdNormalizer.Normalize(app);
        string normalizedSql = ArmResourceIdNormalizer.Normalize(sql);

        graph.OutgoingEdges[normalizedApp].Should().Contain(edge =>
            edge.EdgeType == GraphEdgeTypes.CanReach
            && string.Equals(edge.ToNodeId, normalizedSql, StringComparison.OrdinalIgnoreCase)
            && edge.InferenceSource == SecureNowArchitectConstants.InsufficientEvidenceDnsHopEdgeType);
    }

    [Theory]
    [InlineData("Approved", false)]
    [InlineData("Pending", true)]
    [InlineData("Rejected", true)]
    [InlineData("Disconnected", true)]
    [InlineData(null, false)]
    public void Both_graphs_apply_endpoint_approval_without_promoting_topology(string? status, bool blocked)
    {
        string vnet = BuildVnet("vnet-a");
        string app = BuildWebApp("app");
        string sql = BuildSqlServer("sql");
        string pe = BuildPrivateEndpoint("pe");
        string zone = $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/privateDnsZones/privatelink.database.windows.net";
        AzureInventoryResourceRecord endpoint = Resource(pe, "Microsoft.Network/privateEndpoints");
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = Guid.NewGuid(), TenantId = Guid.NewGuid(),
                SubscriptionId = SubscriptionId, CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources = [Resource(app, "Microsoft.Web/sites"), Resource(sql, "Microsoft.Sql/servers"), endpoint],
            Properties = status is null ? [] :
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = endpoint.ResourceRowId,
                    PropertyKey = "privateLinkServiceConnections",
                    PropertyValue = System.Text.Json.JsonSerializer.Serialize(new[]
                    {
                        new { properties = new { privateLinkServiceId = sql,
                            privateLinkServiceConnectionState = new { status } } },
                    }),
                },
            ],
            Relationships =
            [
                Relationship(app, BuildSubnet(vnet, "app"), GraphEdgeInferenceSources.InventoryAppServiceSubnet),
                Relationship(pe, sql, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
                Relationship(pe, zone, GraphEdgeInferenceSources.InventoryPeDnsZoneGroup),
                Relationship(zone, vnet, GraphEdgeInferenceSources.InventoryPrivateDnsVnet),
                Relationship(app, sql, GraphEdgeInferenceSources.InventoryPeReachableTarget),
            ],
        };

        var privilege = InventoryPrivilegePathGraph.Build(snapshot);
        var reachability = InventoryReachabilityPathGraph.Build(snapshot);
        var privilegeEdges = privilege.OutgoingEdges.Values.SelectMany(edges => edges)
            .Where(edge => edge.EdgeType == GraphEdgeTypes.CanReach
                && string.Equals(edge.FromNodeId, app, StringComparison.OrdinalIgnoreCase)
                && string.Equals(edge.ToNodeId, sql, StringComparison.OrdinalIgnoreCase)).ToArray();
        var reachabilityEdges = reachability.OutgoingEdges.Values.SelectMany(edges => edges)
            .Where(edge => edge.InferenceSource == GraphEdgeInferenceSources.InventoryPeReachableTarget).ToArray();
        if (blocked)
        {
            privilegeEdges.Should().BeEmpty();
            reachabilityEdges.Should().BeEmpty();
        }
        else
        {
            privilegeEdges.Should().ContainSingle().Which.InferenceSource.Should()
                .Be(SecureNowArchitectConstants.InsufficientEvidenceDnsHopEdgeType);
            reachabilityEdges.Should().ContainSingle();
            var candidates = IntendedReachabilityPathEnumerator.Enumerate(reachability, new PrivilegePathEngineOptions());
            candidates.Should().Contain(candidate => candidate.TerminalAssetNodeId == sql && candidate.HasInsufficientEvidenceHop);
        }
    }

    private static AzureInventoryResourceRelationshipReadModel Relationship(
        string from,
        string to,
        string inferenceSource) =>
        new()
        {
            FromAzureResourceId = from,
            ToAzureResourceId = to,
            RelationshipType = GraphEdgeTypes.ConnectsTo,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            InferenceSource = inferenceSource,
        };

    private static AzureInventoryResourceRecord Resource(string armId, string resourceType) =>
        new()
        {
            ResourceRowId = Guid.NewGuid(),
            SnapshotId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            AzureResourceId = armId,
            ResourceType = resourceType,
            CloudResourceId = Guid.NewGuid(),
        };

    private static string BuildVnet(string name) =>
        $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/{name}";

    private static string BuildSubnet(string vnetArmId, string subnetName) =>
        $"{vnetArmId}/subnets/{subnetName}";

    private static string BuildWebApp(string name) =>
        $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Web/sites/{name}";

    private static string BuildSqlServer(string name) =>
        $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Sql/servers/{name}";

    private static string BuildPrivateEndpoint(string name) =>
        $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/{name}";
}
