using ArchLucid.Contracts.Architecture;

namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Materializes <see cref="GraphNodeTypes.Actor" /> nodes from IaC identity declarations when guided-intake
///     actors are absent (WK-08). Fail-open on unknown shapes.
/// </summary>
public static class DeclarationIdentityActorMaterializer
{
    private static readonly HashSet<string> AllowedTerraformTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "aws_iam_role",
        "azurerm_role_assignment",
        "azuread_service_principal",
        "kubernetes_service_account",
    };

    public static IReadOnlyList<GraphNode> MaterializeFromNodes(
        IReadOnlyList<GraphNode> existingNodes,
        Guid snapshotId)
    {
        ArgumentNullException.ThrowIfNull(existingNodes);

        List<GraphNode> actors = [];
        int index = 0;

        foreach (GraphNode node in existingNodes)
        {
            if (string.Equals(node.NodeType, GraphNodeTypes.Actor, StringComparison.OrdinalIgnoreCase))
                continue;

            if (!TryResolveIdentitySeed(node, out string label, out ActorKind kind, out TrustOrigin trustOrigin))
                continue;

            index++;
            string actorNodeId = $"declaration-actor-{snapshotId:N}-{index}";

            Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
            {
                ["kind"] = kind.ToString(),
                ["trustOrigin"] = trustOrigin.ToString(),
                ["contract"] = InteractionContract.Sync.ToString(),
                ["origin"] = ActorOrigin.Inferred.ToString(),
                ["confidence"] = "70",
                ["declarationSourceNodeId"] = node.NodeId,
            };

            if (GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "k8s.privileged", out string? privileged)
                && string.Equals(privileged, "true", StringComparison.OrdinalIgnoreCase))
            {
                properties["privileged"] = "true";
            }

            actors.Add(new GraphNode
            {
                NodeId = actorNodeId,
                NodeType = GraphNodeTypes.Actor,
                Label = label,
                SourceType = "DeclarationIdentity",
                SourceId = node.SourceId,
                Properties = properties,
            });
        }

        return actors;
    }

    private static bool TryResolveIdentitySeed(
        GraphNode node,
        out string label,
        out ActorKind kind,
        out TrustOrigin trustOrigin)
    {
        if (TryMatchK8sServiceAccount(node, out label))
        {
            kind = ActorKind.Machine;
            trustOrigin = TrustOrigin.Internal;

            return true;
        }

        if (TryMatchTerraformIdentity(node, out label))
        {
            kind = ActorKind.Machine;
            trustOrigin = ResolveTrustOrigin(node);

            return true;
        }

        if (TryMatchArmIdentityResource(node, out label))
        {
            kind = ActorKind.Machine;
            trustOrigin = ResolveTrustOrigin(node);

            return true;
        }

        label = string.Empty;
        kind = ActorKind.Machine;
        trustOrigin = TrustOrigin.Internal;

        return false;
    }

    private static bool TryMatchK8sServiceAccount(GraphNode node, out string label)
    {
        if (!GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "k8s.kind", out string? kind)
            || !string.Equals(kind, "serviceaccount", StringComparison.OrdinalIgnoreCase))
        {
            label = string.Empty;

            return false;
        }

        label = GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "k8s.name", out string? name)
                && !string.IsNullOrWhiteSpace(name)
            ? name.Trim()
            : node.Label;

        return true;
    }

    private static bool TryMatchTerraformIdentity(GraphNode node, out string label)
    {
        if (!GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "terraformType", out string? terraformType)
            || string.IsNullOrWhiteSpace(terraformType)
            || !AllowedTerraformTypes.Contains(terraformType.Trim()))
        {
            label = string.Empty;

            return false;
        }

        label = string.IsNullOrWhiteSpace(node.Label) ? terraformType.Trim() : node.Label.Trim();

        return true;
    }

    private static bool TryMatchArmIdentityResource(GraphNode node, out string label)
    {
        if (!GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "resourceType", out string? resourceType)
            || string.IsNullOrWhiteSpace(resourceType))
        {
            label = string.Empty;

            return false;
        }

        string normalized = resourceType.Trim().ToLowerInvariant();

        if (!normalized.Contains("roleassignment", StringComparison.Ordinal)
            && !normalized.Contains("serviceprincipal", StringComparison.Ordinal)
            && !normalized.Contains("userassignedidentity", StringComparison.Ordinal))
        {
            label = string.Empty;

            return false;
        }

        label = string.IsNullOrWhiteSpace(node.Label) ? normalized : node.Label.Trim();

        return true;
    }

    private static TrustOrigin ResolveTrustOrigin(GraphNode node)
    {
        if (GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "anonymous", out string? anonymous)
            && string.Equals(anonymous, "true", StringComparison.OrdinalIgnoreCase))
        {
            return TrustOrigin.PublicAnonymous;
        }

        if (GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "trustOrigin", out string? trustOrigin)
            && Enum.TryParse(trustOrigin, ignoreCase: true, out TrustOrigin parsed))
        {
            return parsed;
        }

        foreach (KeyValuePair<string, string> entry in node.Properties)
        {
            if (!entry.Key.Contains("public", StringComparison.OrdinalIgnoreCase)
                && !entry.Key.Contains("anonymous", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (string.Equals(entry.Value, "true", StringComparison.OrdinalIgnoreCase)
                || string.Equals(entry.Value, "enabled", StringComparison.OrdinalIgnoreCase)
                || string.Equals(entry.Value, "allow", StringComparison.OrdinalIgnoreCase))
            {
                return TrustOrigin.External;
            }
        }

        return TrustOrigin.Internal;
    }
}
