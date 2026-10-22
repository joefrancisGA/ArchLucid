using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>Maps stored managed-identity role assignments onto their workload resource nodes (NR-28).</summary>
internal static class AzureInventorySnapshotRoleAssignmentEdgeHydrator
{
    public static void AddMissingRoleAssignmentEdges(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<GraphNode> nodes,
        IReadOnlyDictionary<string, string> nodeIdByArmId,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys,
        AzureInventorySnapshotPropertyIndex? propertyIndex = null)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(nodeIdByArmId);
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(edgeKeys);

        Dictionary<Guid, List<string>> principalIdsByResourceRowId = BuildPrincipalIdsByResourceRowId(snapshot, propertyIndex ?? AzureInventorySnapshotPropertyIndex.Create(snapshot));
        Dictionary<string, string> nodeIdByPrincipalId = BuildNodeIdByPrincipalId(
            snapshot,
            nodes,
            principalIdsByResourceRowId,
            nodeIdByArmId);

        foreach (AzureInventoryRoleAssignmentReadModel assignment in snapshot.RoleAssignments)
        {
            string principalId = assignment.PrincipalId.Trim();
            string scope = ArmResourceIdNormalizer.Normalize(assignment.Scope);

            if (string.IsNullOrWhiteSpace(principalId)
                || string.IsNullOrWhiteSpace(scope)
                || !nodeIdByPrincipalId.TryGetValue(principalId, out string? fromNodeId))
            {
                continue;
            }

            string toNodeId = AzureInventoryArmEndpointNodeResolver.TryResolveExactOrAncestorNodeId(
                    nodeIdByArmId,
                    scope,
                    out string resourceNodeId)
                ? resourceNodeId
                : "role-scope-" + MermaidIdSanitizer.Sanitize(scope);
            GraphEdge? edge = AzureInventorySnapshotGraphEdgeAppender.TryAdd(
                edges, edgeKeys, fromNodeId, toNodeId, GraphEdgeTypes.HasRole,
                GraphEdgeInferenceSources.InventoryRbacAssignment,
                provenanceKind: ProvenanceKind.ObservedFact.ToString(),
                promoteStrongerProvenance: false, allowSelfEdges: true,
                identityKey: AzureInventoryRoleAssignmentIdentity.Create(principalId, scope, assignment.RoleDefinitionId));

            if (edge is null)
            {
                continue;
            }

            string? roleName;
            try
            {
                roleName = AzureInventoryBuiltInRoleDefinitionNames.TryResolveFromRoleDefinitionId(assignment.RoleDefinitionId);
            }
            catch (ArgumentException)
            {
                // Failed role lookup historically reserves the key without inserting an edge.
                edges.Remove(edge);
                throw;
            }
            edge.Properties["principalId"] = principalId;
            edge.Properties["scope"] = scope;
            edge.Properties["roleDefinitionId"] = assignment.RoleDefinitionId;

            if (!string.IsNullOrWhiteSpace(roleName))
            {
                edge.Properties["roleName"] = roleName;
            }
        }
    }

    private static Dictionary<Guid, List<string>> BuildPrincipalIdsByResourceRowId(
        AzureInventorySnapshotDetailReadModel snapshot,
        AzureInventorySnapshotPropertyIndex propertyIndex)
    {
        Dictionary<Guid, List<string>> principalIdsByResourceRowId = new();
        IReadOnlyDictionary<Guid, List<AzureInventoryResourcePropertyReadModel>> propertiesByResourceRowId = propertyIndex.ByResourceRowId;

        foreach (AzureInventoryResourceRecord resource in snapshot.Resources)
        {
            if (!propertiesByResourceRowId.TryGetValue(
                    resource.ResourceRowId,
                    out List<AzureInventoryResourcePropertyReadModel>? properties))
            {
                continue;
            }

            List<string> principalIds = properties
                .Where(property => property.PropertyKey.Equals("identity", StringComparison.OrdinalIgnoreCase) && !property.IsRedacted)
                .SelectMany(property => AzureInventoryComputeIdentityPrincipalIndex.ReadPrincipalIds(property.PropertyValue))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (principalIds.Count > 0)
            {
                principalIdsByResourceRowId[resource.ResourceRowId] = principalIds;
            }
        }

        return principalIdsByResourceRowId;
    }

    private static Dictionary<string, string> BuildNodeIdByPrincipalId(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<GraphNode> nodes,
        IReadOnlyDictionary<Guid, List<string>> principalIdsByResourceRowId,
        IReadOnlyDictionary<string, string> nodeIdByArmId)
    {
        Dictionary<string, string> nodeIdByPrincipalId = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, AzureInventoryResourceRecord> resourcesByArmId = snapshot.Resources
            .Where(resource => !string.IsNullOrWhiteSpace(resource.AzureResourceId))
            .ToDictionary(
                resource => ArmResourceIdNormalizer.Normalize(resource.AzureResourceId),
                resource => resource,
                StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in nodes)
        {
            string armId = ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(node));

            if (!resourcesByArmId.TryGetValue(armId, out AzureInventoryResourceRecord? resource)
                || !principalIdsByResourceRowId.TryGetValue(
                    resource.ResourceRowId,
                    out List<string>? principalIds)
                || !nodeIdByArmId.TryGetValue(armId, out string? nodeId))
            {
                continue;
            }

            foreach (string principalId in principalIds)
            {
                nodeIdByPrincipalId[principalId] = nodeId;
            }
        }

        return nodeIdByPrincipalId;
    }
}
