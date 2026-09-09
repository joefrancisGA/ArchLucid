using ArchLucid.Contracts.Architecture;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Emits declaration-derived IAM and data-flow path edges when both ends already exist on the snapshot (DX-69).
///     Does not invent principal, scope, or backend hops.
/// </summary>
public static class DeclarationIdentityPathEdgeMaterializer
{
    public static IReadOnlyList<GraphEdge> Materialize(IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        List<GraphEdge> edges = [];

        foreach (GraphNode roleAssignment in nodes.Where(IsRoleAssignmentNode))
        {
            edges.AddRange(MaterializeIamPath(roleAssignment, nodes));
        }

        foreach (GraphNode actor in nodes.Where(IsDeclarationSeededActor))
        {
            edges.AddRange(MaterializeDataFlowPath(actor, nodes));
        }

        return GraphEdgeInferenceHelpers.Deduplicate(edges);
    }

    private static IReadOnlyList<GraphEdge> MaterializeIamPath(
        GraphNode roleAssignment,
        IReadOnlyList<GraphNode> nodes)
    {
        if (!TryReadProperty(roleAssignment.Properties, "principalId", out string? principalId))
            return [];

        if (!TryReadProperty(roleAssignment.Properties, "declarationTargetResourceId", out string? targetId)
            && !TryReadProperty(roleAssignment.Properties, "scope", out targetId)
            && !TryReadProperty(roleAssignment.Properties, "targetResourceId", out targetId))
        {
            return [];
        }

        GraphNode? target = DeclarationExistingNodeResolver.FindExistingDeclaredNode(nodes, targetId);

        if (target is null)
            return [];

        List<GraphEdge> edges =
        [
            GraphEdgeInferenceHelpers.CreateEdge(
                roleAssignment.NodeId,
                target.NodeId,
                GraphEdgeTypes.AppliesTo,
                "Role assignment applies to declared scope",
                1.0,
                GraphEdgeInferenceSources.DeclarationIdentityIamPath),
        ];

        foreach (GraphNode actor in nodes.Where(static node =>
                     string.Equals(node.NodeType, GraphNodeTypes.Actor, StringComparison.OrdinalIgnoreCase)))
        {
            if (!ActorMatchesPrincipal(actor, principalId, nodes))
                continue;

            edges.Add(
                GraphEdgeInferenceHelpers.CreateEdge(
                    actor.NodeId,
                    roleAssignment.NodeId,
                    GraphEdgeTypes.RelatesTo,
                    "Actor relates to declared role assignment",
                    1.0,
                    GraphEdgeInferenceSources.DeclarationIdentityIamPath));
        }

        return edges;
    }

    private static IReadOnlyList<GraphEdge> MaterializeDataFlowPath(
        GraphNode actor,
        IReadOnlyList<GraphNode> nodes)
    {
        if (!IsExternalDeclarationActor(actor))
            return [];

        GraphNode? source = ResolveDeclarationSource(actor, nodes);

        if (source is null || !IsExternalEdgeSource(source))
            return [];

        GraphNode? compute = ResolveDeclaredBackend(source, actor, nodes);

        if (compute is null)
            return [];

        List<GraphEdge> edges =
        [
            GraphEdgeInferenceHelpers.CreateEdge(
                actor.NodeId,
                compute.NodeId,
                GraphEdgeTypes.ConnectsTo,
                "External actor connects to declared backend",
                1.0,
                GraphEdgeInferenceSources.DeclarationIdentityDataFlowPath),
        ];

        GraphNode? datastore = ResolveDeclaredDatastore(compute, nodes);

        if (datastore is not null)
        {
            edges.Add(
                GraphEdgeInferenceHelpers.CreateEdge(
                    compute.NodeId,
                    datastore.NodeId,
                    GraphEdgeTypes.ConnectsTo,
                    "Compute connects to declared datastore",
                    1.0,
                    GraphEdgeInferenceSources.DeclarationIdentityDataFlowPath));
        }

        return edges;
    }

    private static bool IsRoleAssignmentNode(GraphNode node)
    {
        if (!string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(node.NodeType, GraphNodeTypes.PolicyControl, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (TryReadProperty(node.Properties, "terraformType", out string? terraformType)
            && DeclarationIamTerraformTypes.IsRoleAssignmentTerraformType(terraformType))
        {
            return true;
        }

        if (TryReadProperty(node.Properties, "resourceType", out string? resourceType)
            && DeclarationIamTerraformTypes.IsRoleAssignmentResourceType(resourceType))
        {
            return true;
        }

        return false;
    }

    private static bool IsDeclarationSeededActor(GraphNode node)
    {
        if (!string.Equals(node.NodeType, GraphNodeTypes.Actor, StringComparison.OrdinalIgnoreCase))
            return false;

        return TryReadProperty(node.Properties, "declarationSourceNodeId", out _);
    }

    private static bool IsExternalDeclarationActor(GraphNode actor)
    {
        if (!TryReadProperty(actor.Properties, "trustOrigin", out string? trustOrigin))
            return false;

        return string.Equals(trustOrigin, nameof(TrustOrigin.External), StringComparison.OrdinalIgnoreCase)
            || string.Equals(trustOrigin, nameof(TrustOrigin.PublicAnonymous), StringComparison.OrdinalIgnoreCase);
    }

    private static bool ActorMatchesPrincipal(
        GraphNode actor,
        string principalId,
        IReadOnlyList<GraphNode> nodes)
    {
        if (DeclarationExistingNodeResolver.IdsEqual(actor.Label, principalId))
            return true;

        if (TryReadProperty(actor.Properties, "principalId", out string? actorPrincipal)
            && string.Equals(actorPrincipal, principalId, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        GraphNode? source = ResolveDeclarationSource(actor, nodes);

        if (source is null)
            return false;

        return DeclarationExistingNodeResolver.NodeMatchesDeclaredId(source, principalId);
    }

    private static GraphNode? ResolveDeclarationSource(GraphNode actor, IReadOnlyList<GraphNode> nodes)
    {
        if (!TryReadProperty(actor.Properties, "declarationSourceNodeId", out string? sourceId))
            return null;

        return nodes.FirstOrDefault(node =>
            node is not null && IdsEqual(node.NodeId, sourceId));
    }

    private static GraphNode? ResolveDeclaredBackend(
        GraphNode source,
        GraphNode actor,
        IReadOnlyList<GraphNode> nodes)
    {
        List<string> candidates = CollectDeclaredTargetIds(source);
        candidates.AddRange(CollectDeclaredTargetIds(actor));

        foreach (string candidate in candidates)
        {
            GraphNode? match = DeclarationExistingNodeResolver.FindExistingDeclaredNode(nodes, candidate);

            if (match is not null && !IdsEqual(match.NodeId, source.NodeId))
                return match;
        }

        return null;
    }

    private static GraphNode? ResolveDeclaredDatastore(GraphNode compute, IReadOnlyList<GraphNode> nodes)
    {
        foreach (string candidate in CollectDeclaredTargetIds(compute))
        {
            GraphNode? match = DeclarationExistingNodeResolver.FindExistingDeclaredNode(nodes, candidate);

            if (match is null || IdsEqual(match.NodeId, compute.NodeId))
                continue;

            if (LooksLikeDatastore(match))
                return match;
        }

        return null;
    }

    private static List<string> CollectDeclaredTargetIds(GraphNode node)
    {
        string[] keys =
        [
            "declarationBackendNodeId",
            "connectedToNodeIds",
            CanonicalGraphPropertyKeys.DependsOnNodeIds,
            "declarationTargetResourceId",
        ];

        List<string> values = [];

        foreach (string key in keys)
        {
            if (!TryReadProperty(node.Properties, key, out string? raw))
                continue;

            foreach (string part in raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (!string.IsNullOrWhiteSpace(part))
                    values.Add(part);
            }
        }

        return values;
    }

    private static bool IsExternalEdgeSource(GraphNode node)
    {
        if (TryReadProperty(node.Properties, "k8s.kind", out string? k8sKind))
        {
            if (string.Equals(k8sKind, "ingress", StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(k8sKind, "service", StringComparison.OrdinalIgnoreCase)
                && TryReadProperty(node.Properties, "k8s.servicetype", out string? serviceType)
                && string.Equals(serviceType, "loadbalancer", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        if (TryReadProperty(node.Properties, "terraformType", out string? terraformType)
            && !string.IsNullOrWhiteSpace(terraformType))
        {
            string normalized = terraformType.Trim();

            if (normalized.Equals("aws_lb", StringComparison.OrdinalIgnoreCase)
                || normalized.Equals("aws_alb", StringComparison.OrdinalIgnoreCase)
                || normalized.Equals("azurerm_api_management", StringComparison.OrdinalIgnoreCase)
                || normalized.Equals("google_compute_global_forwarding_rule", StringComparison.OrdinalIgnoreCase)
                || normalized.StartsWith("azurerm_cdn_frontdoor", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        if (TryReadProperty(node.Properties, "resourceType", out string? resourceType)
            && !string.IsNullOrWhiteSpace(resourceType))
        {
            string normalized = resourceType.Trim().ToLowerInvariant();

            if (normalized.Contains("frontdoor", StringComparison.Ordinal)
                || normalized.Contains("apimanagement", StringComparison.Ordinal)
                || normalized.Contains("loadbalancer", StringComparison.Ordinal)
                || normalized.Contains("forwardingrule", StringComparison.Ordinal))
            {
                return true;
            }
        }

        return false;
    }

    private static bool LooksLikeDatastore(GraphNode node)
    {
        if (TryReadProperty(node.Properties, "category", out string? category)
            && (string.Equals(category, GraphTopologyCategories.Data, StringComparison.OrdinalIgnoreCase)
                || string.Equals(category, GraphTopologyCategories.Storage, StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        string combined = $"{node.Label} {node.SourceId}".ToLowerInvariant();

        return combined.Contains("sql", StringComparison.Ordinal)
            || combined.Contains("storage", StringComparison.Ordinal)
            || combined.Contains("keyvault", StringComparison.Ordinal)
            || combined.Contains("key-vault", StringComparison.Ordinal)
            || combined.Contains("database", StringComparison.Ordinal)
            || combined.Contains("cosmos", StringComparison.Ordinal)
            || combined.Contains("secret", StringComparison.Ordinal)
            || combined.Contains("s3", StringComparison.Ordinal)
            || combined.Contains("bucket", StringComparison.Ordinal);
    }

    private static bool TryReadProperty(
        IReadOnlyDictionary<string, string>? properties,
        string key,
        out string value)
    {
        value = string.Empty;

        if (properties is null)
            return false;

        if (!GraphNodePropertyReader.TryGetPropertyValue(properties, key, out string? raw)
            || string.IsNullOrWhiteSpace(raw))
        {
            return false;
        }

        value = raw.Trim();
        return true;
    }

    private static bool IdsEqual(string? left, string? right)
    {
        if (string.IsNullOrWhiteSpace(left) || string.IsNullOrWhiteSpace(right))
            return false;

        return string.Equals(left.Trim(), right.Trim(), StringComparison.OrdinalIgnoreCase);
    }
}
