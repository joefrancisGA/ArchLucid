using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Suite", "Application")]
public sealed class AzureInventoryPrivateEndpointReachableEdgeMapperTests
{
    private const string SubscriptionId = "11111111-1111-1111-1111-111111111111";

    [Fact]
    public void MapPeReachableTargets_same_vnet_app_service_emits_highly_likely_hop()
    {
        string vnetA = BuildVnet("vnet-a");
        string subnetA = BuildSubnet(vnetA, "subnet-a");
        string app = BuildWebApp("orders-api");
        string sql = BuildSqlServer("sql1");
        string pe = BuildPrivateEndpoint("pe-sql");
        string zone = BuildPrivateDnsZone("privatelink.database.windows.net");

        List<AzureInventoryResourceRelationshipWrite> relationships =
        [
            Observed(app, subnetA, GraphEdgeInferenceSources.InventoryAppServiceSubnet),
            Observed(pe, sql, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
            Observed(pe, zone, GraphEdgeInferenceSources.InventoryPeDnsZoneGroup),
            Observed(zone, vnetA, GraphEdgeInferenceSources.InventoryPrivateDnsVnet),
            Observed(pe, subnetA, GraphEdgeInferenceSources.InventoryPeSubnet),
        ];

        List<string> warnings = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);

        AzureInventoryPrivateEndpointReachableEdgeMapper.MapPeReachableTargets(relationships, keys, warnings);

        warnings.Should().BeEmpty("mapper should not warn when DNS join is complete");
        relationships.Should().ContainSingle(relationship =>
            relationship.FromAzureResourceId == ArmResourceIdNormalizer.Normalize(app)
            && relationship.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(sql)
            && relationship.InferenceSource == GraphEdgeInferenceSources.InventoryPeReachableTarget
            && relationship.ProvenanceKind == ProvenanceKind.DerivedFact);
        warnings.Should().BeEmpty();
    }

    [Fact]
    public void MapPeReachableTargets_hub_spoke_with_dns_link_to_spoke_emits_edge()
    {
        string hubVnet = BuildVnet("hub");
        string spokeVnet = BuildVnet("spoke-b");
        string hubSubnet = BuildSubnet(hubVnet, "pe-subnet");
        string spokeSubnet = BuildSubnet(spokeVnet, "app-subnet");
        string app = BuildWebApp("orders-api");
        string sql = BuildSqlServer("sql1");
        string pe = BuildPrivateEndpoint("pe-sql");
        string zone = BuildPrivateDnsZone("privatelink.database.windows.net");

        List<AzureInventoryResourceRelationshipWrite> relationships =
        [
            Observed(app, spokeSubnet, GraphEdgeInferenceSources.InventoryAppServiceSubnet),
            Observed(pe, sql, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
            Observed(pe, zone, GraphEdgeInferenceSources.InventoryPeDnsZoneGroup),
            Observed(zone, spokeVnet, GraphEdgeInferenceSources.InventoryPrivateDnsVnet),
            Observed(pe, hubSubnet, GraphEdgeInferenceSources.InventoryPeSubnet),
        ];

        AzureInventoryPrivateEndpointReachableEdgeMapper.MapPeReachableTargets(
            relationships,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase),
            []);

        relationships.Should().ContainSingle(relationship =>
            relationship.FromAzureResourceId == ArmResourceIdNormalizer.Normalize(app)
            && relationship.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(sql)
            && relationship.InferenceSource == GraphEdgeInferenceSources.InventoryPeReachableTarget);
    }

    [Fact]
    public void MapPeReachableTargets_hub_spoke_without_dns_link_does_not_fan_out()
    {
        string hubVnet = BuildVnet("hub");
        string vnetB = BuildVnet("spoke-b");
        string vnetC = BuildVnet("spoke-c");
        string hubSubnet = BuildSubnet(hubVnet, "pe-subnet");
        string subnetB = BuildSubnet(vnetB, "app-subnet-b");
        string subnetC = BuildSubnet(vnetC, "app-subnet-c");
        string appLinked = BuildWebApp("app-linked");
        string appUnlinked = BuildWebApp("app-unlinked");
        string sql = BuildSqlServer("sql1");
        string pe = BuildPrivateEndpoint("pe-sql");
        string zone = BuildPrivateDnsZone("privatelink.database.windows.net");

        List<AzureInventoryResourceRelationshipWrite> relationships =
        [
            Observed(appLinked, subnetB, GraphEdgeInferenceSources.InventoryAppServiceSubnet),
            Observed(appUnlinked, subnetC, GraphEdgeInferenceSources.InventoryAppServiceSubnet),
            Observed(pe, sql, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
            Observed(pe, zone, GraphEdgeInferenceSources.InventoryPeDnsZoneGroup),
            Observed(zone, vnetB, GraphEdgeInferenceSources.InventoryPrivateDnsVnet),
            Observed(pe, hubSubnet, GraphEdgeInferenceSources.InventoryPeSubnet),
        ];

        AzureInventoryPrivateEndpointReachableEdgeMapper.MapPeReachableTargets(
            relationships,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase),
            []);

        relationships.Should().ContainSingle(relationship =>
            relationship.InferenceSource == GraphEdgeInferenceSources.InventoryPeReachableTarget
            && relationship.FromAzureResourceId == ArmResourceIdNormalizer.Normalize(appLinked)
            && relationship.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(sql));
        relationships.Should().NotContain(relationship =>
            relationship.InferenceSource == GraphEdgeInferenceSources.InventoryPeReachableTarget
            && relationship.FromAzureResourceId == ArmResourceIdNormalizer.Normalize(appUnlinked));
    }

    [Fact]
    public void MapPeReachableTargets_integration_without_dns_emits_no_edge()
    {
        string vnetA = BuildVnet("vnet-a");
        string subnetA = BuildSubnet(vnetA, "subnet-a");
        string app = BuildWebApp("orders-api");
        string sql = BuildSqlServer("sql1");
        string pe = BuildPrivateEndpoint("pe-sql");

        List<AzureInventoryResourceRelationshipWrite> relationships =
        [
            Observed(app, subnetA, GraphEdgeInferenceSources.InventoryAppServiceSubnet),
            Observed(pe, sql, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
        ];

        AzureInventoryPrivateEndpointReachableEdgeMapper.MapPeReachableTargets(
            relationships,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase),
            []);

        relationships.Should().NotContain(relationship =>
            relationship.InferenceSource == GraphEdgeInferenceSources.InventoryPeReachableTarget);
    }

    private static AzureInventoryResourceRelationshipWrite Observed(
        string fromArmId,
        string toArmId,
        string inferenceSource)
    {
        return new AzureInventoryResourceRelationshipWrite
        {
            FromAzureResourceId = ArmResourceIdNormalizer.Normalize(fromArmId),
            ToAzureResourceId = ArmResourceIdNormalizer.Normalize(toArmId),
            RelationshipType = GraphEdgeTypes.ConnectsTo,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            InferenceSource = inferenceSource,
        };
    }

    private static string BuildVnet(string name) =>
        $"/subscriptions/{SubscriptionId}/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/{name}";

    private static string BuildSubnet(string vnetArmId, string subnetName) =>
        $"{vnetArmId}/subnets/{subnetName}";

    private static string BuildWebApp(string name) =>
        $"/subscriptions/{SubscriptionId}/resourceGroups/rg-app/providers/Microsoft.Web/sites/{name}";

    private static string BuildSqlServer(string name) =>
        $"/subscriptions/{SubscriptionId}/resourceGroups/rg-data/providers/Microsoft.Sql/servers/{name}";

    private static string BuildPrivateEndpoint(string name) =>
        $"/subscriptions/{SubscriptionId}/resourceGroups/rg-net/providers/Microsoft.Network/privateEndpoints/{name}";

    private static string BuildPrivateDnsZone(string name) =>
        $"/subscriptions/{SubscriptionId}/resourceGroups/rg-net/providers/Microsoft.Network/privateDnsZones/{name}";
}
