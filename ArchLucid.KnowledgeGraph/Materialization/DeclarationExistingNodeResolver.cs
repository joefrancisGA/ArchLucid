using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Resolves already-materialized declaration nodes by NodeId, label, or cloud identity keys (DX-69, DX-74).
///     Does not invent hops — returns null when the declared id is not on the snapshot.
/// </summary>
public static class DeclarationExistingNodeResolver
{
    private static readonly string[] IdentityKeys =
    [
        "resourceId",
        "armResourceId",
        "azureResourceId",
        "id",
        "tf.id",
        "tf.resource_id",
        "name",
        "tf.name",
        "tf.bucket",
        "bucket",
        "tf.secret_id",
        "secret_id",
        "tf.identifier",
        "tf.account_id",
        "principalId",
        "tf.principal_id",
    ];

    public static GraphNode? FindExistingDeclaredNode(IReadOnlyList<GraphNode> nodes, string? declaredId)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        if (string.IsNullOrWhiteSpace(declaredId))
            return null;

        string needle = declaredId.Trim();

        foreach (GraphNode node in nodes)
        {
            if (node is null || !IsResolvableNodeType(node.NodeType))
                continue;

            if (NodeMatchesDeclaredId(node, needle))
                return node;
        }

        return null;
    }

    public static bool NodeMatchesDeclaredId(GraphNode node, string? declaredId)
    {
        ArgumentNullException.ThrowIfNull(node);

        if (string.IsNullOrWhiteSpace(declaredId))
            return false;

        string needle = declaredId.Trim();

        if (IdsEqual(node.NodeId, needle) || IdsEqual(node.Label, needle))
            return true;

        foreach (string key in IdentityKeys)
        {
            if (TryReadProperty(node.Properties, key, out string value) && IdsEqual(value, needle))
                return true;
        }

        if (TerraformResourceAddressMatcher.NodeMatchesTerraformResourceAddress(node, needle))
        {
            return true;
        }

        return false;
    }

    public static bool TryReadProperty(
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

    public static bool IdsEqual(string? left, string? right)
    {
        if (string.IsNullOrWhiteSpace(left) || string.IsNullOrWhiteSpace(right))
            return false;

        return string.Equals(left.Trim(), right.Trim(), StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsResolvableNodeType(string? nodeType)
    {
        return string.Equals(nodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase)
            || string.Equals(nodeType, GraphNodeTypes.SecurityBaseline, StringComparison.OrdinalIgnoreCase)
            || string.Equals(nodeType, GraphNodeTypes.PolicyControl, StringComparison.OrdinalIgnoreCase);
    }
}
