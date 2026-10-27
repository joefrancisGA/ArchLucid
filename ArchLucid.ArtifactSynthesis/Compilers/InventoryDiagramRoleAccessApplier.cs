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

        List<(string SourceDiagramNodeId, string TargetDiagramNodeId, string RoleName)> pairGrants = new();

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

            pairGrants.Add((sourceDiagramNodeId, targetDiagramNodeId, roleName));
        }

        foreach (IGrouping<(string SourceDiagramNodeId, string TargetDiagramNodeId), (string SourceDiagramNodeId, string TargetDiagramNodeId, string RoleName)> group in pairGrants.GroupBy(grant => (grant.SourceDiagramNodeId, grant.TargetDiagramNodeId)))
        {
            string sourceDiagramNodeId = group.Key.SourceDiagramNodeId;
            string targetDiagramNodeId = group.Key.TargetDiagramNodeId;
            string accessLabel = ResolveResourcePairAccessLabel(group.Select(grant => grant.RoleName).ToList());

            InventoryDiagramRelationshipEdgeHelper.ReplaceOrAddDirectedEdge(
                ast,
                sourceDiagramNodeId,
                targetDiagramNodeId,
                accessLabel,
                GraphEdgeInferenceSources.InventoryRbacAssignment,
                ProvenanceKind.ObservedFact.ToString());

            // A diagram access line summarizes a resource pair; the graph retains each grant separately.
            DiagramEdge accessEdge = ast.Edges.First(candidate =>
                !candidate.IsLayoutOnly
                && candidate.FromNodeId == sourceDiagramNodeId
                && candidate.ToNodeId == targetDiagramNodeId
                && candidate.InferenceSource == GraphEdgeInferenceSources.InventoryRbacAssignment);
            ast.Edges.RemoveAll(candidate =>
                !ReferenceEquals(candidate, accessEdge)
                && !candidate.IsLayoutOnly
                && candidate.FromNodeId == sourceDiagramNodeId
                && candidate.ToNodeId == targetDiagramNodeId
                && candidate.InferenceSource == GraphEdgeInferenceSources.InventoryRbacAssignment);
        }
    }

    private static string ResolveResourcePairAccessLabel(IReadOnlyList<string> roleNames)
    {
        if (roleNames.Count > 1)
        {
            HashSet<string> distinctRoleNames = new(StringComparer.OrdinalIgnoreCase);

            foreach (string roleName in roleNames)
            {
                distinctRoleNames.Add(roleName.Trim());
            }

            if (distinctRoleNames.Count > 1)
            {
                return "Role names were not listed on this line.";
            }
        }

        return InventoryDiagramRelationshipLabelTexts.FormatRoleAssignmentAccessLabel(roleNames[0]);
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
        string sentence = FormatBroadScopeOutline(roleName, normalizedScope);

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

    private static string FormatBroadScopeOutline(string roleName, string normalizedScope)
    {
        bool roleNameMissing = string.Equals(
            roleName,
            "Role name was not stored.",
            StringComparison.Ordinal);

        if (normalizedScope.Contains("/resourceGroups/", StringComparison.OrdinalIgnoreCase))
        {
            string resourceGroupName = ReadResourceName(normalizedScope);

            if (roleNameMissing)
            {
                return $"Role name was not stored. Scope is resource group {resourceGroupName}.";
            }

            return $"{roleName} on resource group {resourceGroupName}";
        }

        string subscriptionId = ReadSubscriptionId(normalizedScope);

        if (string.Equals(subscriptionId, "Subscription id was not stored.", StringComparison.Ordinal))
        {
            return subscriptionId;
        }

        if (roleNameMissing)
        {
            return $"Role name was not stored. Scope is subscription id {subscriptionId}. Subscription name was not stored.";
        }

        return $"{roleName} at subscription scope (subscription id {subscriptionId}). Subscription name was not stored. Observed use was not stored.";
    }

    private static string ReadResourceName(string scope)
    {
        const string resourceGroupsSegment = "/resourceGroups/";
        int resourceGroupIndex = scope.IndexOf(resourceGroupsSegment, StringComparison.OrdinalIgnoreCase);
        if (resourceGroupIndex >= 0)
        {
            int nameStart = resourceGroupIndex + resourceGroupsSegment.Length;
            if (nameStart >= scope.Length)
            {
                return "Resource group name was stored empty.";
            }

            int nameEnd = scope.IndexOf('/', nameStart);
            string resourceGroupName = (nameEnd < 0 ? scope[nameStart..] : scope[nameStart..nameEnd]).Trim();

            return resourceGroupName.Length > 0
                ? resourceGroupName
                : "Resource group name was stored empty.";
        }

        int lastSlash = scope.LastIndexOf('/');

        if (lastSlash < 0 || lastSlash >= scope.Length - 1)
        {
            return "Resource group name was not stored.";
        }

        string trailingSegment = scope[(lastSlash + 1)..].Trim();

        return trailingSegment.Length > 0
            ? trailingSegment
            : "Resource group name was stored empty.";
    }

    private static string ReadSubscriptionId(string scope)
    {
        const string prefix = "/subscriptions/";

        if (!scope.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            return "Subscription id was not stored.";
        }

        int end = scope.IndexOf('/', prefix.Length);

        if (end < 0)
        {
            string trailing = scope[prefix.Length..].Trim();

            return trailing.Length > 0 ? trailing : "Subscription id was not stored.";
        }

        string subscriptionId = scope[prefix.Length..end].Trim();

        return subscriptionId.Length > 0 ? subscriptionId : "Subscription id was not stored.";
    }
}
