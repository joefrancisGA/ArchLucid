using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Replaces a Databricks access-connector card with a workspace → storage edge
///     when the workspace names the connector and the connector identity has a storage data role.
/// </summary>
internal static class AzureInventorySnapshotDatabricksAccessConnectorEdgeHydrator
{
    public static void AddMissingAccessConnectorEdges(
        AzureInventorySnapshotDetailReadModel snapshot,
        Dictionary<string, string> nodeIdByArmId,
        List<GraphNode> nodes,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(nodeIdByArmId);
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(edgeKeys);

        Dictionary<Guid, Dictionary<string, string>> propertiesByRowId = IndexProperties(snapshot.Properties);
        Dictionary<string, AzureInventoryResourceRecord> connectorsByArmId = new(StringComparer.OrdinalIgnoreCase);
        List<AzureInventoryResourceRecord> workspaces = [];
        HashSet<string> storageArmIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourceRecord resource in snapshot.Resources)
        {
            string armId = ArmResourceIdNormalizer.Normalize(resource.AzureResourceId);

            if (AzureInventoryDatabricksAccessConnector.IsAccessConnectorType(resource.ResourceType))
            {
                connectorsByArmId[armId] = resource;
            }
            else if (AzureInventoryDatabricksAccessConnector.IsWorkspaceType(resource.ResourceType))
            {
                workspaces.Add(resource);
            }
            else if (IsStorageAccount(resource.ResourceType))
            {
                storageArmIds.Add(armId);
            }
        }

        if (workspaces.Count == 0 || connectorsByArmId.Count == 0 || storageArmIds.Count == 0)
        {
            return;
        }

        Dictionary<string, GraphNode> nodesById = nodes.ToDictionary(node => node.NodeId, StringComparer.Ordinal);
        HashSet<string> collapsedConnectorNodeIds = new(StringComparer.Ordinal);

        foreach (AzureInventoryResourceRecord workspace in workspaces)
        {
            if (!propertiesByRowId.TryGetValue(workspace.ResourceRowId, out Dictionary<string, string>? workspaceProperties)
                || !workspaceProperties.TryGetValue(
                    AzureInventoryDatabricksAccessConnector.IdPropertyKey,
                    out string? connectorArmId)
                || string.IsNullOrWhiteSpace(connectorArmId))
            {
                continue;
            }

            string normalizedConnectorId = ArmResourceIdNormalizer.Normalize(connectorArmId);

            if (!connectorsByArmId.TryGetValue(normalizedConnectorId, out AzureInventoryResourceRecord? connector)
                || !nodeIdByArmId.TryGetValue(normalizedConnectorId, out string? connectorNodeId))
            {
                continue;
            }

            if (!propertiesByRowId.TryGetValue(connector.ResourceRowId, out Dictionary<string, string>? connectorProperties)
                || !connectorProperties.TryGetValue(
                    AzureInventoryDatabricksAccessConnector.IdentityPropertyKey,
                    out string? identityJson))
            {
                continue;
            }

            HashSet<string> principalIds = AzureInventoryComputeIdentityPrincipalIndex
                .ReadPrincipalIds(identityJson)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            if (principalIds.Count == 0
                || !nodeIdByArmId.TryGetValue(
                    ArmResourceIdNormalizer.Normalize(workspace.AzureResourceId),
                    out string? fromNodeId)
                || string.IsNullOrWhiteSpace(fromNodeId))
            {
                continue;
            }

            string connectorLabel = ReadResourceName(connector.AzureResourceId);

            foreach (AzureInventoryRoleAssignmentReadModel assignment in snapshot.RoleAssignments)
            {
                if (!principalIds.Contains(assignment.PrincipalId.Trim()))
                {
                    continue;
                }

                if (!TryResolveStorageAccountArmId(assignment.Scope, storageArmIds, out string storageArmId))
                {
                    continue;
                }

                if (!IsStorageDataRole(assignment.RoleDefinitionId))
                {
                    continue;
                }

                if (!nodeIdByArmId.TryGetValue(storageArmId, out string? toNodeId)
                    || string.IsNullOrWhiteSpace(toNodeId))
                {
                    continue;
                }

                AzureInventorySnapshotGraphEdgeAppender.TryAdd(
                    edges,
                    edgeKeys,
                    fromNodeId,
                    toNodeId,
                    AzureInventoryDatabricksAccessConnector.EdgeType,
                    GraphEdgeInferenceSources.InventoryDatabricksAccessConnector,
                    label: connectorLabel,
                    provenanceKind: ProvenanceKind.DerivedFact.ToString());

                collapsedConnectorNodeIds.Add(connectorNodeId);
            }
        }

        foreach (string connectorNodeId in collapsedConnectorNodeIds)
        {
            if (nodesById.TryGetValue(connectorNodeId, out GraphNode? connectorNode))
            {
                connectorNode.Properties[AzureInventoryDatabricksAccessConnector.CollapseNodePropertyKey] = "true";
            }
        }
    }

    private static bool IsStorageDataRole(string? roleDefinitionId)
    {
        if (string.IsNullOrWhiteSpace(roleDefinitionId))
        {
            return false;
        }

        if (roleDefinitionId.Contains(
                AzureInventoryDatabricksAccessConnector.StorageBlobDataOwnerRoleDefinitionId,
                StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        string? roleName = AzureInventoryBuiltInRoleDefinitionNames.TryResolveFromRoleDefinitionId(roleDefinitionId);

        return AzureInventoryRbacDataPlaneRoleMap.Resolve(roleName)
            is not AzureInventoryDerivedDataPlanePermission.None;
    }

    private static bool TryResolveStorageAccountArmId(
        string? scope,
        IReadOnlySet<string> storageArmIds,
        out string storageArmId)
    {
        storageArmId = string.Empty;

        if (string.IsNullOrWhiteSpace(scope))
        {
            return false;
        }

        string normalizedScope = ArmResourceIdNormalizer.Normalize(scope);
        const string marker = "/providers/microsoft.storage/storageaccounts/";
        int markerIndex = normalizedScope.IndexOf(marker, StringComparison.OrdinalIgnoreCase);

        if (markerIndex < 0)
        {
            return false;
        }

        int nameStart = markerIndex + marker.Length;
        int nameEnd = normalizedScope.IndexOf('/', nameStart);

        string accountArmId = nameEnd < 0
            ? normalizedScope
            : normalizedScope[..nameEnd];

        if (!storageArmIds.Contains(accountArmId))
        {
            return false;
        }

        storageArmId = accountArmId;

        return true;
    }

    private static bool IsStorageAccount(string? resourceType)
    {
        return (resourceType ?? string.Empty)
            .Equals("Microsoft.Storage/storageAccounts", StringComparison.OrdinalIgnoreCase);
    }

    private static string ReadResourceName(string azureResourceId)
    {
        int lastSlash = azureResourceId.LastIndexOf('/');

        if (lastSlash >= 0 && lastSlash < azureResourceId.Length - 1)
        {
            return azureResourceId[(lastSlash + 1)..];
        }

        return azureResourceId;
    }

    private static Dictionary<Guid, Dictionary<string, string>> IndexProperties(
        IReadOnlyList<AzureInventoryResourcePropertyReadModel> properties)
    {
        Dictionary<Guid, Dictionary<string, string>> indexed = [];

        foreach (AzureInventoryResourcePropertyReadModel property in properties)
        {
            if (string.IsNullOrWhiteSpace(property.PropertyKey) || property.PropertyValue is null)
            {
                continue;
            }

            if (!indexed.TryGetValue(property.ResourceRowId, out Dictionary<string, string>? row))
            {
                row = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                indexed[property.ResourceRowId] = row;
            }

            row[property.PropertyKey] = property.PropertyValue;
        }

        return indexed;
    }
}
