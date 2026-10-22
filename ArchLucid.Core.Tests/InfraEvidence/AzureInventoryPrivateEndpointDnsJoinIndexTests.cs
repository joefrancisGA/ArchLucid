using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryPrivateEndpointDnsJoinIndexTests
{
    private const string SubscriptionId = "11111111-1111-1111-1111-111111111111";

    [Fact]
    public void IsMissingDnsJoin_true_when_integrated_compute_and_pe_without_dns_join()
    {
        string vnet = BuildVnet("vnet-a");
        string subnet = BuildSubnet(vnet, "subnet-a");
        string app = BuildWebApp("orders-api");
        string sql = BuildSqlServer("sql1");
        string pe = BuildPrivateEndpoint("pe-sql");

        AzureInventoryPrivateEndpointDnsJoinIndex index = AzureInventoryPrivateEndpointDnsJoinIndex.Build(
        [
            Triple(app, subnet, GraphEdgeInferenceSources.InventoryAppServiceSubnet),
            Triple(pe, sql, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
        ]);

        index.IsMissingDnsJoin(app, sql).Should().BeTrue();
        index.HasPeReachableTarget(app, sql).Should().BeFalse();
    }

    [Fact]
    public void ComputeToVnetArmId_values_are_normalized_when_subnet_arm_id_has_extra_slash_before_subnets_segment()
    {
        string vnet = BuildVnet("vnet-a");
        string subnet = $"{vnet}//subnets/subnet-a";
        string app = BuildWebApp("orders-api");

        AzureInventoryPrivateEndpointDnsJoinIndex index = AzureInventoryPrivateEndpointDnsJoinIndex.Build(
        [
            Triple(app, subnet, GraphEdgeInferenceSources.InventoryAppServiceSubnet),
        ]);

        index.ComputeToVnetArmId.Should().ContainKey(ArmResourceIdNormalizer.Normalize(app));
        index.ComputeToVnetArmId[ArmResourceIdNormalizer.Normalize(app)]
            .Should()
            .Be(ArmResourceIdNormalizer.Normalize(vnet));
    }

    [Fact]
    public void HasPeReachableTarget_true_when_materialized_edge_present()
    {
        string vnet = BuildVnet("vnet-a");
        string subnet = BuildSubnet(vnet, "subnet-a");
        string app = BuildWebApp("orders-api");
        string sql = BuildSqlServer("sql1");
        string pe = BuildPrivateEndpoint("pe-sql");
        string zone = BuildPrivateDnsZone("privatelink.database.windows.net");

        AzureInventoryPrivateEndpointDnsJoinIndex index = AzureInventoryPrivateEndpointDnsJoinIndex.Build(
        [
            Triple(app, subnet, GraphEdgeInferenceSources.InventoryAppServiceSubnet),
            Triple(pe, sql, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
            Triple(pe, zone, GraphEdgeInferenceSources.InventoryPeDnsZoneGroup),
            Triple(zone, vnet, GraphEdgeInferenceSources.InventoryPrivateDnsVnet),
            Triple(app, sql, GraphEdgeInferenceSources.InventoryPeReachableTarget),
        ]);

        index.HasPeReachableTarget(app, sql).Should().BeTrue();
        index.IsMissingDnsJoin(app, sql).Should().BeFalse();
        index.TryHasDnsJoin(pe, vnet).Should().BeTrue();
    }

    private static AzureInventoryRelationshipArmTriple Triple(string from, string to, string inferenceSource) =>
        new(from, to, inferenceSource);

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

    private static string BuildPrivateDnsZone(string name) =>
        $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/privateDnsZones/{name}";
}
