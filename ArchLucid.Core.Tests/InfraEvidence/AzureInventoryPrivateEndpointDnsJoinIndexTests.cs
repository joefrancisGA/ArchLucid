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

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void Multiple_zone_groups_preserve_join_independent_of_order(bool reverse)
    {
        string vnet = BuildVnet("vnet-a");
        string pe = BuildPrivateEndpoint("pe1");
        string linked = BuildPrivateDnsZone("linked.example");
        string unlinked = BuildPrivateDnsZone("unlinked.example");
        AzureInventoryRelationshipArmTriple[] rows =
        [
            Triple(pe, linked, GraphEdgeInferenceSources.InventoryPeDnsZoneGroup),
            Triple(pe, unlinked, GraphEdgeInferenceSources.InventoryPeDnsZoneGroup),
            Triple(linked, vnet, GraphEdgeInferenceSources.InventoryPrivateDnsVnet),
        ];
        if (reverse)
            Array.Reverse(rows);
        AzureInventoryPrivateEndpointDnsJoinIndex.Build(rows).TryHasDnsJoin(pe, vnet).Should().BeTrue();
    }

    [Fact]
    public void Stale_materialized_reachability_is_not_a_verified_dns_join()
    {
        string app = BuildWebApp("app");
        string target = BuildSqlServer("sql");
        string pe = BuildPrivateEndpoint("pe1");
        var index = AzureInventoryPrivateEndpointDnsJoinIndex.Build(
        [
            Triple(app, BuildSubnet(BuildVnet("vnet-a"), "subnet"), GraphEdgeInferenceSources.InventoryAppServiceSubnet),
            Triple(pe, target, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
            Triple(app, target, GraphEdgeInferenceSources.InventoryPeReachableTarget),
        ]);
        index.HasPeReachableTarget(app, target).Should().BeFalse();
        index.IsMissingDnsJoin(app, target).Should().BeTrue();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void Multiple_nics_subnets_and_targets_preserve_all_configuration_joins(bool reverse)
    {
        string vm = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm";
        string nic1 = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1";
        string nic2 = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic2";
        string vnet1 = BuildVnet("a");
        string vnet2 = BuildVnet("b");
        string pe = BuildPrivateEndpoint("pe");
        string target1 = BuildSqlServer("sql1");
        string target2 = BuildSqlServer("sql2");
        string zone = BuildPrivateDnsZone("privatelink.database.windows.net");
        AzureInventoryRelationshipArmTriple[] rows =
        [
            Triple(vm, nic1, GraphEdgeInferenceSources.InventoryVmNic),
            Triple(vm, nic2, GraphEdgeInferenceSources.InventoryVmNic),
            Triple(nic1, BuildSubnet(vnet1, "s1"), GraphEdgeInferenceSources.InventoryNicSubnet),
            Triple(nic1, BuildSubnet(vnet1, "s2"), GraphEdgeInferenceSources.InventoryNicSubnet),
            Triple(nic2, BuildSubnet(vnet2, "s3"), GraphEdgeInferenceSources.InventoryNicSubnet),
            Triple(pe, target1, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
            Triple(pe, target2, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
            Triple(pe, zone, GraphEdgeInferenceSources.InventoryPeDnsZoneGroup),
            Triple(zone, vnet1, GraphEdgeInferenceSources.InventoryPrivateDnsVnet),
        ];
        if (reverse)
            Array.Reverse(rows);

        var index = AzureInventoryPrivateEndpointDnsJoinIndex.Build(rows);
        index.ComputeToVnetArmIds[ArmResourceIdNormalizer.Normalize(vm)].Should().HaveCount(2);
        index.PrivateEndpointToTargetArmIds[ArmResourceIdNormalizer.Normalize(pe)].Should().HaveCount(2);
        index.HasConfigurationDnsJoin(vm, target1).Should().BeTrue();
        index.HasConfigurationDnsJoin(vm, target2).Should().BeTrue();
        index.ComputeToVnetArmId.Should().NotContainKey(ArmResourceIdNormalizer.Normalize(vm));
        index.HasConfigurationDnsJoin(vm, BuildSqlServer("unrelated")).Should().BeFalse();
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
