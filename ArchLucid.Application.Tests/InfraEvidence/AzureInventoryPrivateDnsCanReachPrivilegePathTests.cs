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
