using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Versioned catalog of <c>network-associations.json</c> <c>associationType</c> values (IE-RF-01).
/// </summary>
public static class AzureInventoryRelationshipAssociationTypes
{
    public const string NicToSubnet = "nicToSubnet";

    public const string PublicIpToNic = "publicIpToNic";

    public const string PrivateEndpointTarget = "privateEndpointTarget";

    /// <summary>
    ///     Storage service-tag heuristic from NSG rules — not an ARM association id; stays DeterministicInference.
    /// </summary>
    public const string NsgAllowRule = "nsgAllowRule";

    public const string VmToNic = "vmToNic";

    public const string NicToNsg = "nicToNsg";

    public const string SubnetToNsg = "subnetToNsg";

    public const string SubnetToRouteTable = "subnetToRouteTable";

    public const string VnetPeering = "vnetPeering";

    public const string PeToNic = "peToNic";

    public const string PeToSubnet = "peToSubnet";

    public const string AgwToBackend = "agwToBackend";

    public const string LbToBackend = "lbToBackend";

    public const string PrivateDnsVnetLink = "privateDnsVnetLink";

    public const string AppServiceToSubnet = "appServiceToSubnet";

    private static readonly AzureInventoryRelationshipAssociationTypeDefinition[] Catalog =
    [
        Observed(NicToSubnet, AzureInventoryRelationshipArmKind.NetworkInterface, AzureInventoryRelationshipArmKind.Subnet, "CONNECTS_TO", "inventory-nic-subnet"),
        Observed(PublicIpToNic, AzureInventoryRelationshipArmKind.PublicIpAddress, AzureInventoryRelationshipArmKind.NetworkInterface, "EXPOSES", "inventory-public-ip"),
        Observed(PrivateEndpointTarget, AzureInventoryRelationshipArmKind.PrivateEndpoint, AzureInventoryRelationshipArmKind.BackendPoolMember, "CONNECTS_TO", "inventory-private-endpoint"),
        // nsgAllowRule is a subnet→storage heuristic from NSG rule text, not a cited ARM association id.
        Inferred(NsgAllowRule, AzureInventoryRelationshipArmKind.Subnet, AzureInventoryRelationshipArmKind.StorageAccount, "ROUTES_TO", "inventory-nsg-allow-rule", ProvenanceKind.DeterministicInference),
        Observed(VmToNic, AzureInventoryRelationshipArmKind.VirtualMachine, AzureInventoryRelationshipArmKind.NetworkInterface, "CONNECTS_TO", "inventory-vm-nic"),
        Observed(NicToNsg, AzureInventoryRelationshipArmKind.NetworkInterface, AzureInventoryRelationshipArmKind.NetworkSecurityGroup, "APPLIES_TO", "inventory-nic-nsg"),
        Observed(SubnetToNsg, AzureInventoryRelationshipArmKind.Subnet, AzureInventoryRelationshipArmKind.NetworkSecurityGroup, "APPLIES_TO", "inventory-subnet-nsg"),
        Observed(SubnetToRouteTable, AzureInventoryRelationshipArmKind.Subnet, AzureInventoryRelationshipArmKind.RouteTable, "APPLIES_TO", "inventory-subnet-route-table"),
        Observed(VnetPeering, AzureInventoryRelationshipArmKind.VirtualNetwork, AzureInventoryRelationshipArmKind.VirtualNetwork, "PEERS_WITH", "inventory-vnet-peering"),
        Observed(PeToNic, AzureInventoryRelationshipArmKind.PrivateEndpoint, AzureInventoryRelationshipArmKind.NetworkInterface, "CONNECTS_TO", "inventory-pe-nic"),
        Observed(PeToSubnet, AzureInventoryRelationshipArmKind.PrivateEndpoint, AzureInventoryRelationshipArmKind.Subnet, "CONNECTS_TO", "inventory-pe-subnet"),
        Observed(AgwToBackend, AzureInventoryRelationshipArmKind.ApplicationGateway, AzureInventoryRelationshipArmKind.BackendPoolMember, "CONNECTS_TO", "inventory-agw-backend"),
        Observed(LbToBackend, AzureInventoryRelationshipArmKind.LoadBalancer, AzureInventoryRelationshipArmKind.NetworkInterface, "CONNECTS_TO", "inventory-lb-backend"),
        Observed(PrivateDnsVnetLink, AzureInventoryRelationshipArmKind.PrivateDnsZone, AzureInventoryRelationshipArmKind.VirtualNetwork, "CONNECTS_TO", "inventory-private-dns-vnet"),
        Observed(AppServiceToSubnet, AzureInventoryRelationshipArmKind.AppService, AzureInventoryRelationshipArmKind.Subnet, "CONNECTS_TO", "inventory-appservice-subnet"),
    ];

    private static readonly Dictionary<string, AzureInventoryRelationshipAssociationTypeDefinition> Lookup =
        Catalog.ToDictionary(definition => definition.AssociationType, StringComparer.OrdinalIgnoreCase);

    public static IReadOnlyList<AzureInventoryRelationshipAssociationTypeDefinition> All => Catalog;

    public static bool IsKnown(string? associationType)
    {
        if (string.IsNullOrWhiteSpace(associationType))
        {
            return false;
        }

        return Lookup.ContainsKey(associationType);
    }

    public static bool TryGet(
        string? associationType,
        out AzureInventoryRelationshipAssociationTypeDefinition? definition)
    {
        definition = null;

        if (string.IsNullOrWhiteSpace(associationType))
        {
            return false;
        }

        if (!Lookup.TryGetValue(associationType, out AzureInventoryRelationshipAssociationTypeDefinition? found))
        {
            return false;
        }

        definition = found;

        return true;
    }

    private static AzureInventoryRelationshipAssociationTypeDefinition Observed(
        string associationType,
        AzureInventoryRelationshipArmKind fromArmKind,
        AzureInventoryRelationshipArmKind toArmKind,
        string graphEdgeType,
        string inferenceSource)
    {
        return Inferred(
            associationType,
            fromArmKind,
            toArmKind,
            graphEdgeType,
            inferenceSource,
            ProvenanceKind.ObservedFact);
    }

    private static AzureInventoryRelationshipAssociationTypeDefinition Inferred(
        string associationType,
        AzureInventoryRelationshipArmKind fromArmKind,
        AzureInventoryRelationshipArmKind toArmKind,
        string graphEdgeType,
        string inferenceSource,
        ProvenanceKind provenanceKind)
    {
        return new AzureInventoryRelationshipAssociationTypeDefinition
        {
            AssociationType = associationType,
            FromArmKind = fromArmKind,
            ToArmKind = toArmKind,
            DefaultProvenanceKind = provenanceKind,
            DefaultGraphEdgeType = graphEdgeType,
            DefaultInferenceSource = inferenceSource,
        };
    }
}
