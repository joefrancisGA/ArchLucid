using ArchLucid.Contracts.Architecture;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Emits NSG/SG association and subnet-to-datastore path edges when both ends already exist (DX-76).
///     Does not invent subnet or datastore hops.
/// </summary>
public static class DeclarationSegmentationPathEdgeMaterializer
{
    public static IReadOnlyList<GraphEdge> Materialize(IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        List<GraphEdge> edges = [];

        foreach (GraphNode association in nodes.Where(IsAssociationNode))
        {
            edges.AddRange(MaterializeAssociation(association, nodes));
        }

        foreach (GraphNode control in nodes.Where(IsControlNode))
        {
            edges.AddRange(MaterializeControlAssociations(control, nodes));
        }

        return GraphEdgeInferenceHelpers.Deduplicate(edges);
    }

    private static IReadOnlyList<GraphEdge> MaterializeAssociation(
        GraphNode association,
        IReadOnlyList<GraphNode> nodes)
    {
        if (!DeclarationExistingNodeResolver.TryReadProperty(
                association.Properties,
                "declarationSegmentationControlId",
                out string controlId)
            && !DeclarationExistingNodeResolver.TryReadProperty(
                association.Properties,
                "tf.network_security_group_id",
                out controlId)
            && !DeclarationExistingNodeResolver.TryReadProperty(
                association.Properties,
                "tf.security_group_id",
                out controlId))
        {
            return [];
        }

        if (!DeclarationExistingNodeResolver.TryReadProperty(
                association.Properties,
                "declarationAssociatedNodeId",
                out string associatedId)
            && !DeclarationExistingNodeResolver.TryReadProperty(
                association.Properties,
                "tf.subnet_id",
                out associatedId))
        {
            return [];
        }

        GraphNode? control = DeclarationExistingNodeResolver.FindExistingDeclaredNode(nodes, controlId);
        GraphNode? associated = DeclarationExistingNodeResolver.FindExistingDeclaredNode(nodes, associatedId);

        if (control is null || associated is null)
            return [];

        return BuildControlToTargetPath(control, associated, nodes);
    }

    private static IReadOnlyList<GraphEdge> MaterializeControlAssociations(
        GraphNode control,
        IReadOnlyList<GraphNode> nodes)
    {
        List<GraphEdge> edges = [];

        foreach (string associatedId in CollectAssociatedIds(control))
        {
            GraphNode? associated = DeclarationExistingNodeResolver.FindExistingDeclaredNode(nodes, associatedId);

            if (associated is null || DeclarationExistingNodeResolver.IdsEqual(associated.NodeId, control.NodeId))
                continue;

            edges.AddRange(BuildControlToTargetPath(control, associated, nodes));
        }

        return edges;
    }

    private static List<GraphEdge> BuildControlToTargetPath(
        GraphNode control,
        GraphNode associated,
        IReadOnlyList<GraphNode> nodes)
    {
        List<GraphEdge> edges =
        [
            GraphEdgeInferenceHelpers.CreateEdge(
                control.NodeId,
                associated.NodeId,
                GraphEdgeTypes.AppliesTo,
                "Segmentation control applies to declared subnet or nic",
                1.0,
                GraphEdgeInferenceSources.DeclarationSegmentationPath),
        ];

        foreach (string datastoreId in CollectDeclaredTargetIds(associated))
        {
            GraphNode? datastore = DeclarationExistingNodeResolver.FindExistingDeclaredNode(nodes, datastoreId);

            if (datastore is null || DeclarationExistingNodeResolver.IdsEqual(datastore.NodeId, associated.NodeId))
                continue;

            if (!LooksLikeDatastore(datastore))
                continue;

            edges.Add(
                GraphEdgeInferenceHelpers.CreateEdge(
                    associated.NodeId,
                    datastore.NodeId,
                    GraphEdgeTypes.ConnectsTo,
                    "Associated network node connects to declared datastore",
                    1.0,
                    GraphEdgeInferenceSources.DeclarationSegmentationPath));
        }

        return edges;
    }

    private static List<string> CollectAssociatedIds(GraphNode node)
    {
        string[] keys =
        [
            "declarationAssociatedNodeId",
            "tf.subnet_id",
            "subnet_id",
            "tf.network_interface_id",
        ];

        return SplitPropertyValues(node, keys);
    }

    private static List<string> CollectDeclaredTargetIds(GraphNode node)
    {
        string[] keys =
        [
            "connectedToNodeIds",
            "declarationBackendNodeId",
            CanonicalGraphPropertyKeys.DependsOnNodeIds,
            "declarationTargetResourceId",
        ];

        return SplitPropertyValues(node, keys);
    }

    private static List<string> SplitPropertyValues(GraphNode node, IReadOnlyList<string> keys)
    {
        List<string> values = [];

        foreach (string key in keys)
        {
            if (!DeclarationExistingNodeResolver.TryReadProperty(node.Properties, key, out string raw))
                continue;

            foreach (string part in raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (!string.IsNullOrWhiteSpace(part))
                    values.Add(part);
            }
        }

        return values;
    }

    private static bool IsAssociationNode(GraphNode node)
    {
        if (!DeclarationExistingNodeResolver.TryReadProperty(node.Properties, "terraformType", out string terraformType))
            return false;

        return DeclarationSegmentationTerraformTypes.IsSegmentationAssociationTerraformType(terraformType);
    }

    private static bool IsControlNode(GraphNode node)
    {
        if (!DeclarationExistingNodeResolver.TryReadProperty(node.Properties, "terraformType", out string terraformType))
            return false;

        return DeclarationSegmentationTerraformTypes.IsSegmentationControlTerraformType(terraformType);
    }

    private static bool LooksLikeDatastore(GraphNode node)
    {
        if (DeclarationExistingNodeResolver.TryReadProperty(node.Properties, "category", out string category)
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
}
