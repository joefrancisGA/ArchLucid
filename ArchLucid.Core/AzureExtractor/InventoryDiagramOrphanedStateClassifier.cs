using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Classifies standalone inventory resources as orphaned or unconnected (NR-05).
///     Only current Azure metadata or ARM references may produce orphaned.
/// </summary>
public static class InventoryDiagramOrphanedStateClassifier
{
    public static InventoryDiagramConnectionStateResult Classify(
        GraphNode graphNode,
        GraphSnapshot graph,
        bool hasCitedDiagramEdges)
    {
        ArgumentNullException.ThrowIfNull(graphNode);
        ArgumentNullException.ThrowIfNull(graph);

        if (hasCitedDiagramEdges)
        {
            return InventoryDiagramConnectionStateResult.None;
        }

        string? armResourceType = ReadArmType(graphNode);

        if (string.IsNullOrWhiteSpace(armResourceType))
        {
            return InventoryDiagramConnectionStateResult.None;
        }

        Dictionary<string, GraphNode> armIdToGraphNode = BuildArmIdToGraphNodeMap(graph.Nodes);
        Dictionary<string, string> properties = graphNode.Properties;
        InventoryDiagramEvidenceCurrency evidenceCurrency = ReadEvidenceCurrency(properties);

        InventoryDiagramConnectionStateResult? orphaned = TryClassifyOrphaned(
            graphNode,
            graph,
            armResourceType,
            properties,
            armIdToGraphNode,
            evidenceCurrency);

        if (orphaned is not null)
        {
            return orphaned;
        }

        if (armResourceType.Equals("Microsoft.Logic/workflows", StringComparison.OrdinalIgnoreCase))
        {
            return ClassifyWorkflow(graphNode, armIdToGraphNode, evidenceCurrency);
        }

        if (TryClassifyUnconnected(armResourceType))
        {
            return InventoryDiagramConnectionStateResult.Unconnected();
        }

        return InventoryDiagramConnectionStateResult.None;
    }

    private static InventoryDiagramConnectionStateResult? TryClassifyOrphaned(
        GraphNode graphNode,
        GraphSnapshot graph,
        string armResourceType,
        IReadOnlyDictionary<string, string> properties,
        IReadOnlyDictionary<string, GraphNode> armIdToGraphNode,
        InventoryDiagramEvidenceCurrency evidenceCurrency)
    {
        if (!IsCurrentEvidence(evidenceCurrency))
        {
            return null;
        }

        if (armResourceType.Equals("Microsoft.Network/publicIPAddresses", StringComparison.OrdinalIgnoreCase))
        {
            return TryClassifyOrphanedPublicIp(graphNode, graph, armIdToGraphNode);
        }

        if (armResourceType.Equals("Microsoft.Network/routeTables", StringComparison.OrdinalIgnoreCase))
        {
            return TryClassifyOrphanedRouteTable(graphNode, graph.Nodes, armIdToGraphNode, properties);
        }

        if (armResourceType.Equals("Microsoft.Network/networkSecurityGroups", StringComparison.OrdinalIgnoreCase))
        {
            return TryClassifyOrphanedNsg(graphNode, graph, armIdToGraphNode, properties);
        }

        if (InventoryDiagramNodeRelationshipClassifier.IsConnectionArmType(armResourceType))
        {
            return TryClassifyOrphanedConnection(properties, armIdToGraphNode);
        }

        if (armResourceType.Equals("Microsoft.Compute/restorePointCollections", StringComparison.OrdinalIgnoreCase))
        {
            return TryClassifyOrphanedRestorePointCollection(properties, armIdToGraphNode);
        }

        if (armResourceType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase))
        {
            return TryClassifyOrphanedPrivateEndpoint(properties, armIdToGraphNode);
        }

        if (armResourceType.Contains("bastionHosts", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Contains("azureFirewalls", StringComparison.OrdinalIgnoreCase)
            || armResourceType.Contains("virtualNetworkGateways", StringComparison.OrdinalIgnoreCase))
        {
            return TryClassifyOrphanedSubnetDependentResource(properties, armIdToGraphNode, armResourceType);
        }

        if (armResourceType.Contains("loadBalancers", StringComparison.OrdinalIgnoreCase))
        {
            return TryClassifyOrphanedLoadBalancer(properties, armIdToGraphNode);
        }

        if (InventoryDiagramParentAttachmentClassifier.TryClassify(
                armResourceType,
                out InventoryDiagramParentAttachmentCategory parentCategory)
            && parentCategory is not InventoryDiagramParentAttachmentCategory.ImageTemplate)
        {
            return TryClassifyOrphanedParentAttachmentChild(
                graphNode,
                graph,
                parentCategory,
                armIdToGraphNode);
        }

        if (IsHostPoolChildArmType(armResourceType))
        {
            return TryClassifyOrphanedHostPoolChild(properties, armResourceType, armIdToGraphNode);
        }

        return null;
    }

    private static InventoryDiagramConnectionStateResult ClassifyWorkflow(
        GraphNode graphNode,
        IReadOnlyDictionary<string, GraphNode> armIdToGraphNode,
        InventoryDiagramEvidenceCurrency evidenceCurrency)
    {
        if (!IsCurrentEvidence(evidenceCurrency))
        {
            return InventoryDiagramConnectionStateResult.Unconnected();
        }

        IReadOnlyList<AzureInventoryWorkflowActionTarget> actions = AzureInventoryWorkflowActionTargetParser.Parse(
            graphNode.Properties);
        List<string> unresolvedDetails = [];

        foreach (AzureInventoryWorkflowActionTarget action in actions)
        {
            if (IsArmIdResolvable(action.TargetArmId, armIdToGraphNode))
            {
                continue;
            }

            string targetName = ReadResourceName(action.TargetArmId, action.ActionName);
            unresolvedDetails.Add($"Unresolved action: {action.ActionName} → {targetName}");
        }

        if (unresolvedDetails.Count > 0)
        {
            return InventoryDiagramConnectionStateResult.WithUnresolvedDetails(unresolvedDetails);
        }

        return actions.Count == 0
            ? InventoryDiagramConnectionStateResult.Unconnected()
            : InventoryDiagramConnectionStateResult.None;
    }

    private static InventoryDiagramConnectionStateResult? TryClassifyOrphanedPublicIp(
        GraphNode graphNode,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, GraphNode> armIdToGraphNode)
    {
        Dictionary<string, HashSet<string>> publicIpReferencingParents =
            AzureInventoryParentAttachmentParentResolver.BuildPublicIpReferencingParentArmIdMap(graph.Nodes);
        AzureInventoryParentAttachmentResolveResult resolved = AzureInventoryParentAttachmentParentResolver.Resolve(
            graphNode,
            graph,
            publicIpReferencingParents);

        if (resolved.HasProvenParent)
        {
            foreach (string parentArmId in resolved.ParentArmIds)
            {
                if (IsArmIdResolvable(parentArmId, armIdToGraphNode))
                {
                    return null;
                }
            }

            string parentName = ReadResourceName(resolved.ParentArmIds[0], "parent resource");
            return InventoryDiagramConnectionStateResult.Orphaned(
                $"parent resource {parentName} no longer exists");
        }

        if (graphNode.Properties.TryGetValue("ipConfiguration.id", out string? ipConfigurationId)
            && !string.IsNullOrWhiteSpace(ipConfigurationId))
        {
            string? associatedResourceId = TryResolveAssociatedResourceFromIpConfiguration(ipConfigurationId);

            if (!string.IsNullOrWhiteSpace(associatedResourceId)
                && !IsArmIdResolvable(associatedResourceId, armIdToGraphNode))
            {
                string parentName = ReadResourceName(associatedResourceId, "parent resource");
                return InventoryDiagramConnectionStateResult.Orphaned(
                    $"parent resource {parentName} no longer exists");
            }
        }

        return InventoryDiagramConnectionStateResult.Orphaned(
            "no IP configuration or parent reference");
    }

    private static InventoryDiagramConnectionStateResult? TryClassifyOrphanedRouteTable(
        GraphNode graphNode,
        IReadOnlyList<GraphNode> topologyNodes,
        IReadOnlyDictionary<string, GraphNode> armIdToGraphNode,
        IReadOnlyDictionary<string, string> properties)
    {
        IReadOnlyList<string> subnetArmIds = AzureInventoryRouteTableSubnetAssociationParser.Parse(properties);

        if (subnetArmIds.Count == 0)
        {
            return InventoryDiagramConnectionStateResult.Orphaned("no subnet association");
        }

        foreach (string subnetArmId in subnetArmIds)
        {
            if (!IsArmIdResolvable(subnetArmId, armIdToGraphNode))
            {
                string subnetName = ReadResourceName(subnetArmId, "subnet");
                return InventoryDiagramConnectionStateResult.Orphaned(
                    $"associated subnet {subnetName} no longer exists");
            }
        }

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        foreach (AzureInventoryRouteTableRoute route in routes)
        {
            string? nextHopArmId = AzureInventoryRouteTableNextHopResolver.Resolve(route, topologyNodes);

            if (string.IsNullOrWhiteSpace(nextHopArmId))
            {
                if (RequiresResolvableNextHop(route))
                {
                    string hopLabel = string.IsNullOrWhiteSpace(route.NextHopIpAddress)
                        ? route.NextHopType ?? "next hop"
                        : route.NextHopIpAddress;
                    return InventoryDiagramConnectionStateResult.Orphaned(
                        $"route next hop {hopLabel} does not resolve");
                }

                continue;
            }

            if (!IsArmIdResolvable(nextHopArmId, armIdToGraphNode))
            {
                string hopName = ReadResourceName(nextHopArmId, "next hop");
                return InventoryDiagramConnectionStateResult.Orphaned(
                    $"route next hop {hopName} no longer exists");
            }
        }

        return null;
    }

    private static InventoryDiagramConnectionStateResult? TryClassifyOrphanedNsg(
        GraphNode graphNode,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, GraphNode> armIdToGraphNode,
        IReadOnlyDictionary<string, string> properties)
    {
        IReadOnlyList<AzureInventoryNsgAssociation> associations = AzureInventoryNsgAssociationParser.Parse(properties);

        if (associations.Count == 0)
        {
            return InventoryDiagramConnectionStateResult.Orphaned(
                "not associated with a subnet or network interface");
        }

        Dictionary<string, string> nicOwnerArmIdByNicArmId = BuildNicOwnerArmIdMap(graph);

        bool resolvedAssociation = false;

        foreach (AzureInventoryNsgAssociation association in associations)
        {
            if (string.IsNullOrWhiteSpace(association.TargetArmId))
            {
                continue;
            }

            string? endpointArmId = ResolveNsgAssociationEndpointArmId(association, nicOwnerArmIdByNicArmId);

            if (string.IsNullOrWhiteSpace(endpointArmId))
            {
                if (!IsArmIdResolvable(association.TargetArmId, armIdToGraphNode))
                {
                    string targetName = ReadResourceName(association.TargetArmId, association.TargetKind ?? "target");
                    return InventoryDiagramConnectionStateResult.Orphaned(
                        $"associated {association.TargetKind?.ToLowerInvariant() ?? "target"} {targetName} no longer exists");
                }

                resolvedAssociation = true;
                continue;
            }

            if (!IsArmIdResolvable(endpointArmId, armIdToGraphNode))
            {
                string targetName = ReadResourceName(endpointArmId, association.TargetKind ?? "target");
                return InventoryDiagramConnectionStateResult.Orphaned(
                    $"associated {association.TargetKind?.ToLowerInvariant() ?? "target"} {targetName} no longer exists");
            }

            resolvedAssociation = true;
        }

        return resolvedAssociation
            ? null
            : InventoryDiagramConnectionStateResult.Orphaned(
                "not associated with a subnet or network interface");
    }

    private static InventoryDiagramConnectionStateResult? TryClassifyOrphanedConnection(
        IReadOnlyDictionary<string, string> properties,
        IReadOnlyDictionary<string, GraphNode> armIdToGraphNode)
    {
        AzureInventoryNetworkConnectionEndpointParseResult endpoints =
            AzureInventoryNetworkConnectionEndpointParser.Parse(properties);

        string? endpoint1 = endpoints.Endpoint1ArmId
            ?? ReadHydratedEndpoint(
                properties,
                InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint1ArmId);
        string? endpoint2 = endpoints.Endpoint2ArmId
            ?? ReadHydratedEndpoint(
                properties,
                InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint2ArmId);

        if (string.IsNullOrWhiteSpace(endpoint1) && string.IsNullOrWhiteSpace(endpoint2))
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(endpoint1) && !IsArmIdResolvable(endpoint1, armIdToGraphNode))
        {
            string endpointName = ReadResourceName(endpoint1, "connection endpoint");
            return InventoryDiagramConnectionStateResult.Orphaned(
                $"connection source {endpointName} no longer exists");
        }

        if (!string.IsNullOrWhiteSpace(endpoint2) && !IsArmIdResolvable(endpoint2, armIdToGraphNode))
        {
            string endpointName = ReadResourceName(endpoint2, "connection destination");
            return InventoryDiagramConnectionStateResult.Orphaned(
                $"connection destination {endpointName} no longer exists");
        }

        return null;
    }

    private static InventoryDiagramConnectionStateResult? TryClassifyOrphanedRestorePointCollection(
        IReadOnlyDictionary<string, string> properties,
        IReadOnlyDictionary<string, GraphNode> armIdToGraphNode)
    {
        string? sourceArmId = AzureInventoryRestorePointCollectionSourceParser.Parse(properties);

        if (string.IsNullOrWhiteSpace(sourceArmId))
        {
            return InventoryDiagramConnectionStateResult.Orphaned(
                "protected virtual machine no longer exists");
        }

        if (!IsArmIdResolvable(sourceArmId, armIdToGraphNode))
        {
            string sourceName = ReadResourceName(sourceArmId, "protected virtual machine");
            string sourceKind = sourceArmId.Contains(
                "virtualMachineScaleSets",
                StringComparison.OrdinalIgnoreCase)
                ? "virtual machine scale set"
                : "virtual machine";

            return InventoryDiagramConnectionStateResult.Orphaned(
                $"protected {sourceKind} {sourceName} no longer exists");
        }

        return null;
    }

    private static InventoryDiagramConnectionStateResult? TryClassifyOrphanedPrivateEndpoint(
        IReadOnlyDictionary<string, string> properties,
        IReadOnlyDictionary<string, GraphNode> armIdToGraphNode)
    {
        string? targetArmId = ReadHydratedEndpoint(
            properties,
            InventoryDiagramOrphanedStatePropertyKeys.PrivateEndpointTargetArmId);

        if (string.IsNullOrWhiteSpace(targetArmId))
        {
            targetArmId = TryReadPrivateEndpointTargetArmId(properties);
        }

        if (string.IsNullOrWhiteSpace(targetArmId))
        {
            return null;
        }

        if (!IsArmIdResolvable(targetArmId, armIdToGraphNode))
        {
            string targetName = ReadResourceName(targetArmId, "private link target");
            return InventoryDiagramConnectionStateResult.Orphaned(
                $"private link target {targetName} no longer exists");
        }

        return null;
    }

    private static InventoryDiagramConnectionStateResult? TryClassifyOrphanedSubnetDependentResource(
        IReadOnlyDictionary<string, string> properties,
        IReadOnlyDictionary<string, GraphNode> armIdToGraphNode,
        string armResourceType)
    {
        string? subnetArmId = ReadHydratedEndpoint(
            properties,
            InventoryDiagramOrphanedStatePropertyKeys.RequiredSubnetArmId)
            ?? TryReadSubnetArmId(properties);
        string? vnetArmId = ReadHydratedEndpoint(
            properties,
            InventoryDiagramOrphanedStatePropertyKeys.RequiredVirtualNetworkArmId);

        if (!string.IsNullOrWhiteSpace(subnetArmId) && !IsArmIdResolvable(subnetArmId, armIdToGraphNode))
        {
            string subnetName = ReadResourceName(subnetArmId, "subnet");
            return InventoryDiagramConnectionStateResult.Orphaned(
                $"required subnet {subnetName} no longer exists");
        }

        if (!string.IsNullOrWhiteSpace(vnetArmId) && !IsArmIdResolvable(vnetArmId, armIdToGraphNode))
        {
            string vnetName = ReadResourceName(vnetArmId, "virtual network");
            return InventoryDiagramConnectionStateResult.Orphaned(
                $"required virtual network {vnetName} no longer exists");
        }

        if (string.IsNullOrWhiteSpace(subnetArmId)
            && (armResourceType.Contains("bastionHosts", StringComparison.OrdinalIgnoreCase)
                || armResourceType.Contains("azureFirewalls", StringComparison.OrdinalIgnoreCase)))
        {
            return InventoryDiagramConnectionStateResult.Orphaned("required subnet no longer exists");
        }

        return null;
    }

    private static InventoryDiagramConnectionStateResult? TryClassifyOrphanedLoadBalancer(
        IReadOnlyDictionary<string, string> properties,
        IReadOnlyDictionary<string, GraphNode> armIdToGraphNode)
    {
        foreach (string referencedArmId in AzureInventoryPublicIpReferenceParser.Parse(properties))
        {
            if (!IsArmIdResolvable(referencedArmId, armIdToGraphNode))
            {
                string resourceName = ReadResourceName(referencedArmId, "referenced resource");
                return InventoryDiagramConnectionStateResult.Orphaned(
                    $"referenced resource {resourceName} no longer exists");
            }
        }

        return null;
    }

    private static InventoryDiagramConnectionStateResult? TryClassifyOrphanedParentAttachmentChild(
        GraphNode graphNode,
        GraphSnapshot graph,
        InventoryDiagramParentAttachmentCategory category,
        IReadOnlyDictionary<string, GraphNode> armIdToGraphNode)
    {
        if (category == InventoryDiagramParentAttachmentCategory.PublicIp)
        {
            return null;
        }

        Dictionary<string, HashSet<string>> publicIpReferencingParents =
            AzureInventoryParentAttachmentParentResolver.BuildPublicIpReferencingParentArmIdMap(graph.Nodes);
        AzureInventoryParentAttachmentResolveResult resolved = AzureInventoryParentAttachmentParentResolver.Resolve(
            graphNode,
            graph,
            publicIpReferencingParents);

        if (resolved.HasProvenParent)
        {
            foreach (string parentArmId in resolved.ParentArmIds)
            {
                if (!IsArmIdResolvable(parentArmId, armIdToGraphNode))
                {
                    string parentName = ReadResourceName(parentArmId, "parent resource");
                    return InventoryDiagramConnectionStateResult.Orphaned(
                        $"parent resource {parentName} no longer exists");
                }
            }
        }

        string? citedParentArmId = ReadCitedParentArmId(graphNode.Properties, category);

        if (!string.IsNullOrWhiteSpace(citedParentArmId) && !IsArmIdResolvable(citedParentArmId, armIdToGraphNode))
        {
            string parentName = ReadResourceName(citedParentArmId, "parent resource");
            return InventoryDiagramConnectionStateResult.Orphaned(
                $"parent resource {parentName} no longer exists");
        }

        return null;
    }

    private static InventoryDiagramConnectionStateResult? TryClassifyOrphanedHostPoolChild(
        IReadOnlyDictionary<string, string> properties,
        string armResourceType,
        IReadOnlyDictionary<string, GraphNode> armIdToGraphNode)
    {
        string? hostPoolArmId = properties.TryGetValue("arm.parentId", out string? parentId)
            && !string.IsNullOrWhiteSpace(parentId)
            ? ArmResourceIdNormalizer.Normalize(parentId)
            : TryReadHostPoolArmIdFromChildArmId(
                properties.TryGetValue("arm.id", out string? armId) ? armId : null);

        if (string.IsNullOrWhiteSpace(hostPoolArmId))
        {
            return null;
        }

        if (!IsArmIdResolvable(hostPoolArmId, armIdToGraphNode))
        {
            string hostPoolName = ReadResourceName(hostPoolArmId, "host pool");
            return InventoryDiagramConnectionStateResult.Orphaned(
                $"parent host pool {hostPoolName} no longer exists");
        }

        return null;
    }

    private static bool TryClassifyUnconnected(string armResourceType)
    {
        if (InventoryDiagramIndirectRelationshipClassifier.TryClassify(
                armResourceType,
                out InventoryDiagramIndirectRelationshipCategory _))
        {
            return true;
        }

        return armResourceType.Equals("Microsoft.Logic/workflows", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsCurrentEvidence(InventoryDiagramEvidenceCurrency evidenceCurrency)
    {
        return evidenceCurrency is InventoryDiagramEvidenceCurrency.Current
            or InventoryDiagramEvidenceCurrency.Derived;
    }

    private static bool RequiresResolvableNextHop(AzureInventoryRouteTableRoute route)
    {
        string? nextHopType = route.NextHopType?.Trim();

        return string.Equals(nextHopType, "VirtualAppliance", StringComparison.OrdinalIgnoreCase)
            || string.Equals(nextHopType, "VirtualNetworkGateway", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsHostPoolChildArmType(string armResourceType)
    {
        return armResourceType.Contains("/hostPools/", StringComparison.OrdinalIgnoreCase)
            && !armResourceType.EndsWith("/hostPools", StringComparison.OrdinalIgnoreCase);
    }

    private static string? ReadCitedParentArmId(
        IReadOnlyDictionary<string, string> properties,
        InventoryDiagramParentAttachmentCategory category)
    {
        if (category == InventoryDiagramParentAttachmentCategory.RestorePointCollection)
        {
            return AzureInventoryRestorePointCollectionSourceParser.Parse(properties);
        }

        if (category == InventoryDiagramParentAttachmentCategory.AccessConnector)
        {
            return AzureInventoryAccessConnectorTargetParser.ParseParentArmId(properties);
        }

        if (properties.TryGetValue("arm.parentId", out string? armParentId)
            && !string.IsNullOrWhiteSpace(armParentId))
        {
            return ArmResourceIdNormalizer.Normalize(armParentId);
        }

        for (int index = 0; index < 16; index++)
        {
            string key =
                $"{InventoryDiagramParentAttachmentPropertyKeys.ParentArmIdPrefix}{index}{InventoryDiagramParentAttachmentPropertyKeys.ParentArmIdSuffix}";

            if (properties.TryGetValue(key, out string? parentArmId)
                && !string.IsNullOrWhiteSpace(parentArmId))
            {
                return ArmResourceIdNormalizer.Normalize(parentArmId);
            }
        }

        return null;
    }

    private static string? TryReadPrivateEndpointTargetArmId(IReadOnlyDictionary<string, string> properties)
    {
        foreach (string key in new[]
                 {
                     "privateLinkServiceConnections",
                     "manualPrivateLinkServiceConnections",
                 })
        {
            if (!properties.TryGetValue(key, out string? json)
                || string.IsNullOrWhiteSpace(json))
            {
                continue;
            }

            string? targetArmId = TryReadPrivateLinkTargetFromJson(json);

            if (!string.IsNullOrWhiteSpace(targetArmId))
            {
                return targetArmId;
            }
        }

        return null;
    }

    private static string? TryReadPrivateLinkTargetFromJson(string json)
    {
        try
        {
            using System.Text.Json.JsonDocument document = System.Text.Json.JsonDocument.Parse(json);

            if (document.RootElement.ValueKind is not System.Text.Json.JsonValueKind.Array)
            {
                return null;
            }

            foreach (System.Text.Json.JsonElement element in document.RootElement.EnumerateArray())
            {
                if (element.ValueKind is not System.Text.Json.JsonValueKind.Object)
                {
                    continue;
                }

                if (!element.TryGetProperty("properties", out System.Text.Json.JsonElement propertiesElement)
                    || propertiesElement.ValueKind is not System.Text.Json.JsonValueKind.Object)
                {
                    continue;
                }

                foreach (string propertyName in new[] { "privateLinkServiceId" })
                {
                    if (!propertiesElement.TryGetProperty(propertyName, out System.Text.Json.JsonElement valueElement))
                    {
                        continue;
                    }

                    if (valueElement.ValueKind is System.Text.Json.JsonValueKind.String)
                    {
                        string? armId = valueElement.GetString();

                        if (!string.IsNullOrWhiteSpace(armId) && armId.StartsWith("/", StringComparison.Ordinal))
                        {
                            return ArmResourceIdNormalizer.Normalize(armId);
                        }
                    }
                }
            }
        }
        catch (System.Text.Json.JsonException)
        {
        }

        return null;
    }

    private static string? TryReadSubnetArmId(IReadOnlyDictionary<string, string> properties)
    {
        if (properties.TryGetValue("subnet.id", out string? subnetId)
            && !string.IsNullOrWhiteSpace(subnetId))
        {
            return ArmResourceIdNormalizer.Normalize(subnetId);
        }

        if (properties.TryGetValue("ipConfigurations", out string? ipConfigurationsJson)
            && !string.IsNullOrWhiteSpace(ipConfigurationsJson))
        {
            return TryReadSubnetArmIdFromIpConfigurations(ipConfigurationsJson);
        }

        return null;
    }

    private static string? TryReadSubnetArmIdFromIpConfigurations(string ipConfigurationsJson)
    {
        try
        {
            using System.Text.Json.JsonDocument document = System.Text.Json.JsonDocument.Parse(ipConfigurationsJson);

            if (document.RootElement.ValueKind is not System.Text.Json.JsonValueKind.Array)
            {
                return null;
            }

            foreach (System.Text.Json.JsonElement ipConfiguration in document.RootElement.EnumerateArray())
            {
                if (!ipConfiguration.TryGetProperty("properties", out System.Text.Json.JsonElement propertiesElement)
                    || propertiesElement.ValueKind is not System.Text.Json.JsonValueKind.Object)
                {
                    continue;
                }

                if (propertiesElement.TryGetProperty("subnet", out System.Text.Json.JsonElement subnetElement)
                    && subnetElement.ValueKind is System.Text.Json.JsonValueKind.Object
                    && subnetElement.TryGetProperty("id", out System.Text.Json.JsonElement subnetIdElement)
                    && subnetIdElement.ValueKind is System.Text.Json.JsonValueKind.String)
                {
                    string? subnetId = subnetIdElement.GetString();

                    if (!string.IsNullOrWhiteSpace(subnetId))
                    {
                        return ArmResourceIdNormalizer.Normalize(subnetId);
                    }
                }
            }
        }
        catch (System.Text.Json.JsonException)
        {
        }

        return null;
    }

    private static string? TryReadHostPoolArmIdFromChildArmId(string? childArmId)
    {
        if (string.IsNullOrWhiteSpace(childArmId))
        {
            return null;
        }

        foreach (string childSegment in new[] { "/sessionHosts/", "/applicationGroups/", "/scalingPlans/" })
        {
            int childSegmentIndex = childArmId.IndexOf(childSegment, StringComparison.OrdinalIgnoreCase);

            if (childSegmentIndex > 0)
            {
                return ArmResourceIdNormalizer.Normalize(childArmId[..childSegmentIndex]);
            }
        }

        return null;
    }

    private static string? TryResolveAssociatedResourceFromIpConfiguration(string ipConfigurationId)
    {
        string normalized = ipConfigurationId.Trim();
        int ipConfigurationsIndex = normalized.IndexOf("/ipConfigurations/", StringComparison.OrdinalIgnoreCase);

        if (ipConfigurationsIndex <= 0)
        {
            return null;
        }

        return normalized[..ipConfigurationsIndex];
    }

    private static string? ReadHydratedEndpoint(IReadOnlyDictionary<string, string> properties, string propertyKey)
    {
        if (!properties.TryGetValue(propertyKey, out string? value) || string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return ArmResourceIdNormalizer.Normalize(value);
    }

    private static string? ResolveNsgAssociationEndpointArmId(
        AzureInventoryNsgAssociation association,
        IReadOnlyDictionary<string, string> nicOwnerArmIdByNicArmId)
    {
        if (string.Equals(
                association.TargetKind,
                AzureInventoryNsgAssociationParser.SubnetKind,
                StringComparison.OrdinalIgnoreCase))
        {
            return association.TargetArmId;
        }

        if (string.Equals(
                association.TargetKind,
                AzureInventoryNsgAssociationParser.NicKind,
                StringComparison.OrdinalIgnoreCase)
            && association.TargetArmId is not null
            && nicOwnerArmIdByNicArmId.TryGetValue(
                ArmResourceIdNormalizer.Normalize(association.TargetArmId),
                out string? ownerArmId))
        {
            return ownerArmId;
        }

        return association.TargetArmId;
    }

    private static Dictionary<string, string> BuildNicOwnerArmIdMap(GraphSnapshot graph)
    {
        Dictionary<string, string> nicOwnerArmIdByNicArmId = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(
                    edge.EdgeType,
                    AzureInventoryRelationshipAssociationTypes.VmToNic,
                    StringComparison.OrdinalIgnoreCase)
                && !string.Equals(
                    edge.InferenceSource,
                    InventoryDiagramIndirectRelationshipEdgeSources.VmNic,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!graphNodesById.TryGetValue(edge.FromNodeId, out GraphNode? ownerNode)
                || !graphNodesById.TryGetValue(edge.ToNodeId, out GraphNode? nicNode))
            {
                continue;
            }

            string ownerArmId = ArmResourceIdNormalizer.Normalize(ReadArmId(ownerNode));
            string nicArmId = ArmResourceIdNormalizer.Normalize(ReadArmId(nicNode));

            if (!string.IsNullOrWhiteSpace(ownerArmId) && !string.IsNullOrWhiteSpace(nicArmId))
            {
                nicOwnerArmIdByNicArmId[nicArmId] = ownerArmId;
            }
        }

        return nicOwnerArmIdByNicArmId;
    }

    private static Dictionary<string, GraphNode> BuildArmIdToGraphNodeMap(IReadOnlyList<GraphNode> nodes)
    {
        Dictionary<string, GraphNode> armIdToGraphNode = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in nodes)
        {
            string armId = ReadArmId(node);

            if (!string.IsNullOrWhiteSpace(armId))
            {
                armIdToGraphNode[ArmResourceIdNormalizer.Normalize(armId)] = node;
            }
        }

        return armIdToGraphNode;
    }

    private static bool IsArmIdResolvable(string? armId, IReadOnlyDictionary<string, GraphNode> armIdToGraphNode)
    {
        if (string.IsNullOrWhiteSpace(armId))
        {
            return false;
        }

        return armIdToGraphNode.ContainsKey(ArmResourceIdNormalizer.Normalize(armId));
    }

    private static InventoryDiagramEvidenceCurrency ReadEvidenceCurrency(IReadOnlyDictionary<string, string> properties)
    {
        foreach (string key in new[]
                 {
                     InventoryDiagramOrphanedStatePropertyKeys.EvidenceCurrency,
                     InventoryDiagramNodeRelationshipPropertyKeys.EvidenceCurrency,
                     InventoryDiagramParentAttachmentPropertyKeys.EvidenceCurrency,
                     InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceCurrency,
                 })
        {
            if (properties.TryGetValue(key, out string? currencyValue)
                && Enum.TryParse(currencyValue, ignoreCase: true, out InventoryDiagramEvidenceCurrency parsed))
            {
                return parsed;
            }
        }

        return InventoryDiagramEvidenceCurrency.Current;
    }

    private static string ReadArmId(GraphNode node)
    {
        return node.Properties.TryGetValue("arm.id", out string? armId) ? armId : string.Empty;
    }

    private static string? ReadArmType(GraphNode node)
    {
        return node.Properties.TryGetValue("arm.type", out string? armType) ? armType : null;
    }

    private static string ReadResourceName(string? armResourceId, string fallbackLabel)
    {
        if (string.IsNullOrWhiteSpace(armResourceId))
        {
            return fallbackLabel;
        }

        int lastSlash = armResourceId.LastIndexOf('/');

        if (lastSlash < 0 || lastSlash >= armResourceId.Length - 1)
        {
            return fallbackLabel;
        }

        return armResourceId[(lastSlash + 1)..];
    }
}
