using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Projects stored resource-scoped role assignments as Has access lines (NR-28).</summary>
internal static class InventoryDiagramRoleAccessApplier
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        Dictionary<string, DiagramNode> diagramNodesById = ast.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges.Where(IsRoleAssignmentEdge))
        {
            string? sourceDiagramNodeId = ResolveDiagramNodeId(edge.FromNodeId, graphToDiagramNodeId, diagramNodesById);
            string? targetDiagramNodeId = ResolveDiagramNodeId(edge.ToNodeId, graphToDiagramNodeId, diagramNodesById);
            string roleName = ReadRoleName(edge);
            string? scope = ReadProperty(edge, "scope");

            if (IsBroadScope(scope))
            {
                AddBroadScopeOutline(ast, sourceDiagramNodeId, roleName, scope!);
                continue;
            }

            if (string.IsNullOrWhiteSpace(sourceDiagramNodeId)
                || string.IsNullOrWhiteSpace(targetDiagramNodeId))
            {
                continue;
            }

            InventoryDiagramRelationshipEdgeHelper.ReplaceOrAddDirectedEdge(
                ast,
                sourceDiagramNodeId,
                targetDiagramNodeId,
                InventoryDiagramRelationshipLabelTexts.HasAccess,
                GraphEdgeInferenceSources.InventoryRbacAssignment,
                ProvenanceKind.ObservedFact.ToString());
        }
    }

    private static bool IsRoleAssignmentEdge(GraphEdge edge)
    {
        return string.Equals(
                   edge.InferenceSource,
                   GraphEdgeInferenceSources.InventoryRbacAssignment,
                   StringComparison.OrdinalIgnoreCase)
               || string.Equals(
                   edge.EdgeType,
                   GraphEdgeTypes.HasRole,
                   StringComparison.OrdinalIgnoreCase)
               || string.Equals(
                   edge.EdgeType,
                   AzureInventoryRelationshipAssociationTypes.IdentityToRoleAssignment,
                   StringComparison.OrdinalIgnoreCase);
    }

    private static string? ResolveDiagramNodeId(
        string graphNodeId,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyDictionary<string, DiagramNode> diagramNodesById)
    {
        return graphToDiagramNodeId.TryGetValue(graphNodeId, out string? diagramNodeId)
            && diagramNodesById.ContainsKey(diagramNodeId)
            ? diagramNodeId
            : null;
    }

    private static bool IsBroadScope(string? scope)
    {
        if (string.IsNullOrWhiteSpace(scope))
        {
            return false;
        }

        string normalizedScope = ArmResourceIdNormalizer.Normalize(scope);

        return AzureInventoryRbacAssignmentScopeClassifier.IsBroadScope(normalizedScope);
    }

    private static void AddBroadScopeOutline(
        DiagramAst ast,
        string? sourceDiagramNodeId,
        string roleName,
        string scope)
    {
        if (string.IsNullOrWhiteSpace(sourceDiagramNodeId))
        {
            return;
        }

        DiagramNode? sourceNode = ast.Nodes.FirstOrDefault(node =>
            string.Equals(node.NodeId, sourceDiagramNodeId, StringComparison.Ordinal));

        if (sourceNode is null)
        {
            return;
        }

        string normalizedScope = ArmResourceIdNormalizer.Normalize(scope);
        string sentence = normalizedScope.Contains("/resourceGroups/", StringComparison.OrdinalIgnoreCase)
            ? $"Has {roleName} on resource group {ReadResourceName(normalizedScope)}"
            : $"Has {roleName} on this subscription";

        if (!sourceNode.UnresolvedRelationshipDetails.Contains(sentence, StringComparer.Ordinal))
        {
            sourceNode.UnresolvedRelationshipDetails.Add(sentence);
        }
    }

    private static string ReadRoleName(GraphEdge edge)
    {
        string? explicitName = ReadProperty(edge, "roleName")
                           ?? ReadProperty(edge, "roleDefinitionName")
                           ?? ReadProperty(edge, "role");

        if (!string.IsNullOrWhiteSpace(explicitName))
        {
            return explicitName.Trim();
        }

        string? roleDefinitionId = ReadProperty(edge, "roleDefinitionId");

        if (!string.IsNullOrWhiteSpace(roleDefinitionId))
        {
            string? resolvedName = AzureInventoryBuiltInRoleDefinitionNames.TryResolveFromRoleDefinitionId(roleDefinitionId);

            if (!string.IsNullOrWhiteSpace(resolvedName))
            {
                return resolvedName;
            }
        }

        return "Role name was not stored.";
    }

    private static string? ReadProperty(GraphEdge edge, string propertyName)
    {
        return edge.Properties.TryGetValue(propertyName, out string? value)
            && !string.IsNullOrWhiteSpace(value)
            ? value
            : null;
    }

    private static string ReadResourceName(string scope)
    {
        int lastSlash = scope.LastIndexOf('/');

        return lastSlash >= 0 && lastSlash < scope.Length - 1
            ? scope[(lastSlash + 1)..]
            : scope;
    }
}
