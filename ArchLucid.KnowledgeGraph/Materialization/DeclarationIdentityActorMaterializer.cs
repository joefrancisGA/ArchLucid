using ArchLucid.Contracts.Architecture;

namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Materializes <see cref="GraphNodeTypes.Actor" /> and optional
///     <see cref="GraphNodeTypes.TrustBoundary" /> nodes from IaC identity and edge declarations when guided-intake
///     actors are absent or incomplete (WK-08, DX-03). Fail-open on unknown shapes.
/// </summary>
public static class DeclarationIdentityActorMaterializer
{
    private static readonly HashSet<string> AllowedTerraformIdentityTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "aws_iam_role",
        "azurerm_role_assignment",
        "azuread_service_principal",
        "kubernetes_service_account",
        "azurerm_user_assigned_identity",
    };

    private static readonly HashSet<string> ExternalEdgeTerraformTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "aws_lb",
        "aws_alb",
        "azurerm_api_management",
        "google_compute_global_forwarding_rule",
    };

    private static readonly HashSet<string> FunctionAppTerraformTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "azurerm_linux_function_app",
        "azurerm_windows_function_app",
        "azurerm_function_app",
    };

    public static IReadOnlyList<GraphNode> MaterializeFromNodes(
        IReadOnlyList<GraphNode> existingNodes,
        Guid snapshotId,
        IReadOnlyList<GraphNode>? existingActors = null)
    {
        ArgumentNullException.ThrowIfNull(existingNodes);

        List<GraphNode> existingActorNodes = CollectExistingActors(existingNodes, existingActors);
        List<GraphNode> materialized = [];
        int index = 0;

        foreach (GraphNode node in existingNodes)
        {
            if (string.Equals(node.NodeType, GraphNodeTypes.Actor, StringComparison.OrdinalIgnoreCase))
                continue;

            if (!TryResolveIdentitySeed(node, out string label, out ActorKind kind, out TrustOrigin trustOrigin))
                continue;

            if (IsDuplicateOfExistingActor(node, label, existingActorNodes))
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

            materialized.Add(
                new GraphNode
                {
                    NodeId = actorNodeId,
                    NodeType = GraphNodeTypes.Actor,
                    Label = label,
                    SourceType = "DeclarationIdentity",
                    SourceId = node.SourceId,
                    Properties = properties,
                });

            if (trustOrigin is TrustOrigin.External or TrustOrigin.PublicAnonymous)
            {
                materialized.Add(CreateTrustBoundaryNode(snapshotId, index, actorNodeId, label, trustOrigin, node.SourceId));
            }
        }

        return materialized;
    }

    private static List<GraphNode> CollectExistingActors(
        IReadOnlyList<GraphNode> existingNodes,
        IReadOnlyList<GraphNode>? existingActors)
    {
        if (existingActors is { Count: > 0 })
            return existingActors
                .Where(static node => string.Equals(node.NodeType, GraphNodeTypes.Actor, StringComparison.OrdinalIgnoreCase))
                .ToList();

        return existingNodes
            .Where(static node => string.Equals(node.NodeType, GraphNodeTypes.Actor, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    private static bool IsDuplicateOfExistingActor(GraphNode sourceNode, string label, IReadOnlyList<GraphNode> existingActors)
    {
        foreach (GraphNode actor in existingActors)
        {
            if (string.Equals(actor.Label, label, StringComparison.OrdinalIgnoreCase))
                return true;

            if (!string.IsNullOrWhiteSpace(sourceNode.SourceId)
                && string.Equals(actor.SourceId, sourceNode.SourceId, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static GraphNode CreateTrustBoundaryNode(
        Guid snapshotId,
        int index,
        string actorNodeId,
        string label,
        TrustOrigin trustOrigin,
        string? sourceId)
    {
        return new GraphNode
        {
            NodeId = $"declaration-trust-boundary-{snapshotId:N}-{index}",
            NodeType = GraphNodeTypes.TrustBoundary,
            Label = $"Trust boundary for {label}",
            SourceType = "DeclarationIdentity",
            SourceId = sourceId ?? snapshotId.ToString(),
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["trustOrigin"] = trustOrigin.ToString(),
                ["actorNodeId"] = actorNodeId,
                ["actorLabel"] = label,
            },
        };
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

        if (TryMatchK8sIngress(node, out label))
        {
            kind = ActorKind.Machine;
            trustOrigin = TrustOrigin.External;

            return true;
        }

        if (TryMatchK8sLoadBalancerService(node, out label))
        {
            kind = ActorKind.Machine;
            trustOrigin = TrustOrigin.External;

            return true;
        }

        if (TryMatchFunctionAppIdentity(node, out label))
        {
            kind = ActorKind.Machine;
            trustOrigin = TrustOrigin.Internal;

            return true;
        }

        if (TryMatchExternalEdgeResource(node, out label))
        {
            kind = ActorKind.Machine;
            trustOrigin = TrustOrigin.External;

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

    private static bool TryMatchK8sIngress(GraphNode node, out string label)
    {
        if (!GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "k8s.kind", out string? kind)
            || !string.Equals(kind, "ingress", StringComparison.OrdinalIgnoreCase))
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

    private static bool TryMatchK8sLoadBalancerService(GraphNode node, out string label)
    {
        if (!GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "k8s.kind", out string? kind)
            || !string.Equals(kind, "service", StringComparison.OrdinalIgnoreCase))
        {
            label = string.Empty;

            return false;
        }

        if (!GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "k8s.servicetype", out string? serviceType)
            || !string.Equals(serviceType, "loadbalancer", StringComparison.OrdinalIgnoreCase))
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

    private static bool TryMatchFunctionAppIdentity(GraphNode node, out string label)
    {
        if (!GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "terraformType", out string? terraformType)
            || string.IsNullOrWhiteSpace(terraformType)
            || !FunctionAppTerraformTypes.Contains(terraformType.Trim()))
        {
            if (!GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "resourceType", out string? resourceType)
                || string.IsNullOrWhiteSpace(resourceType)
                || !resourceType.Contains("microsoft.web/sites", StringComparison.OrdinalIgnoreCase))
            {
                label = string.Empty;

                return false;
            }
        }

        if (!HasManagedIdentityProperty(node))
        {
            label = string.Empty;

            return false;
        }

        label = string.IsNullOrWhiteSpace(node.Label) ? "function-app-identity" : node.Label.Trim();

        return true;
    }

    private static bool TryMatchExternalEdgeResource(GraphNode node, out string label)
    {
        if (GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "terraformType", out string? terraformType)
            && !string.IsNullOrWhiteSpace(terraformType))
        {
            string normalized = terraformType.Trim();

            if (ExternalEdgeTerraformTypes.Contains(normalized)
                || normalized.StartsWith("azurerm_cdn_frontdoor", StringComparison.OrdinalIgnoreCase))
            {
                label = string.IsNullOrWhiteSpace(node.Label) ? normalized : node.Label.Trim();

                return true;
            }
        }

        if (GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "resourceType", out string? resourceType)
            && !string.IsNullOrWhiteSpace(resourceType))
        {
            string normalized = resourceType.Trim().ToLowerInvariant();

            if (normalized.Contains("frontdoor", StringComparison.Ordinal)
                || normalized.Contains("apimanagement", StringComparison.Ordinal)
                || normalized.Contains("loadbalancer", StringComparison.Ordinal)
                || normalized.Contains("forwardingrule", StringComparison.Ordinal))
            {
                label = string.IsNullOrWhiteSpace(node.Label) ? normalized : node.Label.Trim();

                return true;
            }
        }

        label = string.Empty;

        return false;
    }

    private static bool TryMatchTerraformIdentity(GraphNode node, out string label)
    {
        if (!GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "terraformType", out string? terraformType)
            || string.IsNullOrWhiteSpace(terraformType)
            || !AllowedTerraformIdentityTypes.Contains(terraformType.Trim()))
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

    private static bool HasManagedIdentityProperty(GraphNode node)
    {
        foreach (KeyValuePair<string, string> entry in node.Properties)
        {
            if (!entry.Key.Contains("identity", StringComparison.OrdinalIgnoreCase))
                continue;

            if (string.IsNullOrWhiteSpace(entry.Value))
                continue;

            string value = entry.Value.Trim();

            if (value.Contains("system", StringComparison.OrdinalIgnoreCase)
                || value.Contains("user", StringComparison.OrdinalIgnoreCase)
                || value.Contains("assigned", StringComparison.OrdinalIgnoreCase)
                || string.Equals(value, "true", StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
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
