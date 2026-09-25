namespace ArchLucid.Core.AzureExtractor;

/// <summary>Graph node property keys for NR-01 and NR-02 relationship projection.</summary>
public static class InventoryDiagramNodeRelationshipPropertyKeys
{
    public const string EvidenceCurrency = "inventory.relationship.evidenceCurrency";

    public const string ConnectionType = "inventory.connection.connectionType";

    public const string ConnectionEndpoint1ArmId = "inventory.connection.endpoint1ArmId";

    public const string ConnectionEndpoint2ArmId = "inventory.connection.endpoint2ArmId";

    public const string WorkflowActionPrefix = "inventory.workflow.action.";

    public const string WorkflowActionTargetSuffix = ".targetArmId";

    public const string RouteTableSubnetPrefix = "inventory.policy.routeTable.subnet.";

    public const string RoutePrefix = "inventory.policy.route.";

    public const string RouteAddressPrefixSuffix = ".addressPrefix";

    public const string RouteNextHopTypeSuffix = ".nextHopType";

    public const string RouteNextHopIpAddressSuffix = ".nextHopIpAddress";

    public const string RouteNextHopArmIdSuffix = ".nextHopArmId";

    public const string NsgAssociationPrefix = "inventory.policy.nsg.association.";

    public const string NsgAssociationTargetSuffix = ".targetArmId";

    public const string NsgAssociationKindSuffix = ".kind";

    public const string NsgRulePrefix = "inventory.policy.nsg.rule.";

    public const string NsgRuleNameSuffix = ".name";

    public const string NsgRuleProtocolSuffix = ".protocol";

    public const string NsgRuleSourcePortRangeSuffix = ".sourcePortRange";

    public const string NsgRuleDestinationPortRangeSuffix = ".destinationPortRange";

    public const string NsgRuleDirectionSuffix = ".direction";

    public const string NsgRuleAccessSuffix = ".access";

    public const string NsgRulePrioritySuffix = ".priority";

    public const string NsgRuleSourceAddressPrefixSuffix = ".sourceAddressPrefix";

    public const string NsgRuleDestinationAddressPrefixSuffix = ".destinationAddressPrefix";
}
