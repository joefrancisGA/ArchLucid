using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Copies NR-01 connection/workflow and NR-02 policy relationship metadata onto graph nodes during snapshot resolution.
/// </summary>
internal static class AzureInventorySnapshotNodeRelationshipGraphHydrator
{
    public static void Hydrate(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(nodes);

        if (nodes.Count == 0)
        {
            return;
        }

        Dictionary<Guid, List<AzureInventoryResourcePropertyReadModel>> propertiesByRowId =
            snapshot.Properties
                .GroupBy(property => property.ResourceRowId)
                .ToDictionary(group => group.Key, group => group.ToList());

        Dictionary<string, GraphNode> nodesByArmId = nodes
            .Where(node => node.Properties.TryGetValue("arm.id", out string? armId) && !string.IsNullOrWhiteSpace(armId))
            .GroupBy(
                node => ArmResourceIdNormalizer.Normalize(node.Properties["arm.id"]),
                StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourceRecord resource in snapshot.Resources)
        {
            if (!InventoryDiagramNodeRelationshipClassifier.TryClassify(resource.ResourceType, out InventoryDiagramNodeRelationshipCategory category))
            {
                continue;
            }

            string normalizedArmId = ArmResourceIdNormalizer.Normalize(resource.AzureResourceId);

            if (!nodesByArmId.TryGetValue(normalizedArmId, out GraphNode? node))
            {
                continue;
            }

            if (!propertiesByRowId.TryGetValue(resource.ResourceRowId, out List<AzureInventoryResourcePropertyReadModel>? properties))
            {
                continue;
            }

            InventoryDiagramEvidenceCurrency evidenceCurrency =
                InventoryDiagramEvidenceCurrencyLabels.ResolveFromSourceEvidenceReference(resource.SourceEvidenceReference);
            node.Properties[InventoryDiagramNodeRelationshipPropertyKeys.EvidenceCurrency] =
                evidenceCurrency.ToString();

            Dictionary<string, string> propertyDictionary = properties
                .Where(property => !property.IsRedacted && !string.IsNullOrWhiteSpace(property.PropertyValue))
                .ToDictionary(
                    property => property.PropertyKey,
                    property => property.PropertyValue!,
                    StringComparer.OrdinalIgnoreCase);

            switch (category)
            {
                case InventoryDiagramNodeRelationshipCategory.Connection:
                    HydrateConnectionNode(node, resource, propertyDictionary, snapshot.Relationships);
                    break;
                case InventoryDiagramNodeRelationshipCategory.Workflow:
                    HydrateWorkflowNode(node, propertyDictionary);
                    break;
                case InventoryDiagramNodeRelationshipCategory.Policy:
                    HydratePolicyNode(node, resource, propertyDictionary, snapshot.Relationships);
                    break;
            }
        }
    }

    private static void HydrateConnectionNode(
        GraphNode node,
        AzureInventoryResourceRecord resource,
        IReadOnlyDictionary<string, string> properties,
        IReadOnlyList<AzureInventoryResourceRelationshipReadModel> relationships)
    {
        if (resource.ResourceType.Equals("Microsoft.Network/connections", StringComparison.OrdinalIgnoreCase))
        {
            AzureInventoryNetworkConnectionEndpointParseResult parsed =
                AzureInventoryNetworkConnectionEndpointParser.Parse(properties);

            if (!string.IsNullOrWhiteSpace(parsed.ConnectionType))
            {
                node.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionType] = parsed.ConnectionType!;
            }

            if (!string.IsNullOrWhiteSpace(parsed.Endpoint1ArmId))
            {
                node.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint1ArmId] = parsed.Endpoint1ArmId!;
            }

            if (!string.IsNullOrWhiteSpace(parsed.Endpoint2ArmId))
            {
                node.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint2ArmId] = parsed.Endpoint2ArmId!;
            }

            return;
        }

        string normalizedConnectionId = ArmResourceIdNormalizer.Normalize(resource.AzureResourceId);
        string? workflowArmId = null;
        string? targetArmId = null;

        foreach (AzureInventoryResourceRelationshipReadModel relationship in relationships)
        {
            if (relationship.InferenceSource is null
                || !relationship.InferenceSource.Equals(
                    GraphEdgeInferenceSources.InventoryLogicAppConnection,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string fromArmId = ArmResourceIdNormalizer.Normalize(relationship.FromAzureResourceId);
            string toArmId = ArmResourceIdNormalizer.Normalize(relationship.ToAzureResourceId);

            if (toArmId.Equals(normalizedConnectionId, StringComparison.OrdinalIgnoreCase))
            {
                workflowArmId = fromArmId;
            }
            else if (fromArmId.Equals(normalizedConnectionId, StringComparison.OrdinalIgnoreCase))
            {
                targetArmId = toArmId;
            }
        }

        if (!string.IsNullOrWhiteSpace(workflowArmId))
        {
            node.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint1ArmId] = workflowArmId;
        }

        if (!string.IsNullOrWhiteSpace(targetArmId))
        {
            node.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint2ArmId] = targetArmId;
        }
    }

    private static void HydrateWorkflowNode(
        GraphNode node,
        IReadOnlyDictionary<string, string> properties)
    {
        foreach (AzureInventoryWorkflowActionTarget action in AzureInventoryWorkflowActionTargetParser.Parse(properties))
        {
            string propertyKey =
                $"{InventoryDiagramNodeRelationshipPropertyKeys.WorkflowActionPrefix}{action.ActionName}{InventoryDiagramNodeRelationshipPropertyKeys.WorkflowActionTargetSuffix}";
            node.Properties[propertyKey] = action.TargetArmId;
        }
    }

    private static void HydratePolicyNode(
        GraphNode node,
        AzureInventoryResourceRecord resource,
        IReadOnlyDictionary<string, string> properties,
        IReadOnlyList<AzureInventoryResourceRelationshipReadModel> relationships)
    {
        if (resource.ResourceType.Equals("Microsoft.Network/routeTables", StringComparison.OrdinalIgnoreCase))
        {
            HydrateRouteTableNode(node, resource, properties, relationships);
            return;
        }

        if (resource.ResourceType.Equals("Microsoft.Network/networkSecurityGroups", StringComparison.OrdinalIgnoreCase))
        {
            HydrateNsgNode(node, resource, properties, relationships);
        }
    }

    private static void HydrateRouteTableNode(
        GraphNode node,
        AzureInventoryResourceRecord resource,
        IReadOnlyDictionary<string, string> properties,
        IReadOnlyList<AzureInventoryResourceRelationshipReadModel> relationships)
    {
        string normalizedRouteTableId = ArmResourceIdNormalizer.Normalize(resource.AzureResourceId);
        int subnetIndex = 0;

        foreach (AzureInventoryResourceRelationshipReadModel relationship in relationships)
        {
            if (relationship.InferenceSource is null
                || !relationship.InferenceSource.Equals(
                    GraphEdgeInferenceSources.InventorySubnetRouteTable,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string toArmId = ArmResourceIdNormalizer.Normalize(relationship.ToAzureResourceId);

            if (!toArmId.Equals(normalizedRouteTableId, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string subnetArmId = ArmResourceIdNormalizer.Normalize(relationship.FromAzureResourceId);

            if (string.IsNullOrWhiteSpace(subnetArmId))
            {
                continue;
            }

            node.Properties[$"{InventoryDiagramNodeRelationshipPropertyKeys.RouteTableSubnetPrefix}{subnetIndex}"] =
                subnetArmId;
            subnetIndex++;
        }

        int routeIndex = 0;

        foreach (AzureInventoryRouteTableRoute route in AzureInventoryRouteTableRouteParser.Parse(properties))
        {
            string prefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}{routeIndex}";

            if (!string.IsNullOrWhiteSpace(route.AddressPrefix))
            {
                node.Properties[$"{prefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] =
                    route.AddressPrefix;
            }

            if (!string.IsNullOrWhiteSpace(route.NextHopType))
            {
                node.Properties[$"{prefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] =
                    route.NextHopType;
            }

            if (!string.IsNullOrWhiteSpace(route.NextHopIpAddress))
            {
                node.Properties[$"{prefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] =
                    route.NextHopIpAddress;
            }

            if (!string.IsNullOrWhiteSpace(route.NextHopArmId))
            {
                node.Properties[$"{prefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopArmIdSuffix}"] =
                    route.NextHopArmId;
            }

            routeIndex++;
        }
    }

    private static void HydrateNsgNode(
        GraphNode node,
        AzureInventoryResourceRecord resource,
        IReadOnlyDictionary<string, string> properties,
        IReadOnlyList<AzureInventoryResourceRelationshipReadModel> relationships)
    {
        string normalizedNsgId = ArmResourceIdNormalizer.Normalize(resource.AzureResourceId);
        int associationIndex = 0;

        foreach (AzureInventoryResourceRelationshipReadModel relationship in relationships)
        {
            bool isSubnetAssociation = relationship.InferenceSource is not null
                && relationship.InferenceSource.Equals(
                    GraphEdgeInferenceSources.InventorySubnetNsg,
                    StringComparison.OrdinalIgnoreCase);
            bool isNicAssociation = relationship.InferenceSource is not null
                && relationship.InferenceSource.Equals(
                    GraphEdgeInferenceSources.InventoryNicNsg,
                    StringComparison.OrdinalIgnoreCase);

            if (!isSubnetAssociation && !isNicAssociation)
            {
                continue;
            }

            string toArmId = ArmResourceIdNormalizer.Normalize(relationship.ToAzureResourceId);

            if (!toArmId.Equals(normalizedNsgId, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string targetArmId = ArmResourceIdNormalizer.Normalize(relationship.FromAzureResourceId);

            if (string.IsNullOrWhiteSpace(targetArmId))
            {
                continue;
            }

            string associationPrefix =
                $"{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix}{associationIndex}";
            node.Properties[$"{associationPrefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationTargetSuffix}"] =
                targetArmId;
            node.Properties[$"{associationPrefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationKindSuffix}"] =
                isSubnetAssociation ? AzureInventoryNsgAssociationParser.SubnetKind : AzureInventoryNsgAssociationParser.NicKind;
            associationIndex++;
        }

        int ruleIndex = 0;

        foreach (AzureInventoryNsgSecurityRule rule in AzureInventoryNsgSecurityRuleParser.Parse(properties))
        {
            string rulePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrefix}{ruleIndex}";

            if (!string.IsNullOrWhiteSpace(rule.RuleName))
            {
                node.Properties[$"{rulePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleNameSuffix}"] =
                    rule.RuleName;
            }

            if (!string.IsNullOrWhiteSpace(rule.Protocol))
            {
                node.Properties[$"{rulePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleProtocolSuffix}"] =
                    rule.Protocol;
            }

            if (!string.IsNullOrWhiteSpace(rule.SourcePortRange))
            {
                node.Properties[$"{rulePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleSourcePortRangeSuffix}"] =
                    rule.SourcePortRange;
            }

            if (!string.IsNullOrWhiteSpace(rule.DestinationPortRange))
            {
                node.Properties[$"{rulePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleDestinationPortRangeSuffix}"] =
                    rule.DestinationPortRange;
            }

            if (!string.IsNullOrWhiteSpace(rule.Direction))
            {
                node.Properties[$"{rulePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleDirectionSuffix}"] =
                    rule.Direction;
            }

            if (!string.IsNullOrWhiteSpace(rule.Access))
            {
                node.Properties[$"{rulePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleAccessSuffix}"] =
                    rule.Access;
            }

            if (!string.IsNullOrWhiteSpace(rule.Priority))
            {
                node.Properties[$"{rulePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrioritySuffix}"] =
                    rule.Priority;
            }

            if (!string.IsNullOrWhiteSpace(rule.SourceAddressPrefix))
            {
                node.Properties[$"{rulePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleSourceAddressPrefixSuffix}"] =
                    rule.SourceAddressPrefix;
            }

            if (!string.IsNullOrWhiteSpace(rule.DestinationAddressPrefix))
            {
                node.Properties[$"{rulePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleDestinationAddressPrefixSuffix}"] =
                    rule.DestinationAddressPrefix;
            }

            ruleIndex++;
        }
    }
}
