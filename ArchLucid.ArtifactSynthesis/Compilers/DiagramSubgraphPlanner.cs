using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal sealed class DiagramSubgraphPlanner
{
    public IReadOnlyList<DiagramSubgraph> PlanSubgraphs(IReadOnlyList<GraphNode> nodes)
    {
        Dictionary<string, DiagramSubgraph> subgraphs = new(StringComparer.Ordinal);
        Dictionary<string, string> nodeSubgraphAssignments = new(StringComparer.Ordinal);

        foreach (GraphNode node in nodes.OrderBy(DiagramAstGraphNodeClassifier.ReadArmId, StringComparer.Ordinal))
        {
            string armId = DiagramAstGraphNodeClassifier.ReadArmId(node);
            string? subscriptionId = DiagramAstGraphNodeClassifier.ReadSubscriptionId(node);
            string? resourceGroup = DiagramAstGraphNodeClassifier.ReadResourceGroup(node);
            string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);

            if (!string.IsNullOrWhiteSpace(subscriptionId))
            {
                string subscriptionSubgraphId = MermaidIdSanitizer.Sanitize($"sub-{subscriptionId}");
                EnsureSubgraph(
                    subgraphs,
                    subscriptionSubgraphId,
                    $"Subscription {subscriptionId}",
                    parentSubgraphId: null,
                    orderKey: 0);
            }

            if (!string.IsNullOrWhiteSpace(resourceGroup) && !string.IsNullOrWhiteSpace(subscriptionId))
            {
                string resourceGroupSubgraphId = MermaidIdSanitizer.Sanitize($"rg-{subscriptionId}-{resourceGroup}");
                string? parentSubgraphId = MermaidIdSanitizer.Sanitize($"sub-{subscriptionId}");

                EnsureSubgraph(
                    subgraphs,
                    resourceGroupSubgraphId,
                    $"RG {resourceGroup}",
                    parentSubgraphId,
                    orderKey: 1);

                nodeSubgraphAssignments[node.NodeId] = resourceGroupSubgraphId;
            }

            if (AzureInventoryTopologyCategory.IsSubnetArmType(armType))
            {
                string? parentArmId = node.Properties.TryGetValue("arm.parentId", out string? parentId) ? parentId : null;

                if (!string.IsNullOrWhiteSpace(parentArmId)
                    && !string.IsNullOrWhiteSpace(subscriptionId)
                    && !string.IsNullOrWhiteSpace(resourceGroup))
                {
                    string subscriptionSubgraphId = MermaidIdSanitizer.Sanitize($"sub-{subscriptionId}");
                    string resourceGroupSubgraphId = MermaidIdSanitizer.Sanitize($"rg-{subscriptionId}-{resourceGroup}");
                    string vnetSubgraphId = MermaidIdSanitizer.Sanitize($"vnet-{parentArmId}");
                    string subnetSubgraphId = MermaidIdSanitizer.Sanitize($"subnet-{armId}");

                    EnsureSubgraph(
                        subgraphs,
                        subscriptionSubgraphId,
                        $"Subscription {subscriptionId}",
                        parentSubgraphId: null,
                        orderKey: 0);

                    EnsureSubgraph(
                        subgraphs,
                        resourceGroupSubgraphId,
                        $"RG {resourceGroup}",
                        subscriptionSubgraphId,
                        orderKey: 1);

                    EnsureSubgraph(
                        subgraphs,
                        vnetSubgraphId,
                        $"VNet {ReadParentVnetLabel(nodes, parentArmId)}",
                        resourceGroupSubgraphId,
                        orderKey: 2);

                    EnsureSubgraph(
                        subgraphs,
                        subnetSubgraphId,
                        FormatSubnetSubgraphLabel(node.Label),
                        vnetSubgraphId,
                        orderKey: 3);

                    nodeSubgraphAssignments[node.NodeId] = subnetSubgraphId;
                }
            }
        }

        return subgraphs.Values
            .OrderBy(subgraph => subgraph.OrderKey)
            .ThenBy(subgraph => subgraph.SubgraphId, StringComparer.Ordinal)
            .ToList();
    }

    public string? ResolveSubgraphId(GraphNode node, IReadOnlyList<DiagramSubgraph> subgraphs)
    {
        string armId = DiagramAstGraphNodeClassifier.ReadArmId(node);
        string? subscriptionId = DiagramAstGraphNodeClassifier.ReadSubscriptionId(node);
        string? resourceGroup = DiagramAstGraphNodeClassifier.ReadResourceGroup(node);
        string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);

        if (AzureInventoryTopologyCategory.IsSubnetArmType(armType))
        {
            return MermaidIdSanitizer.Sanitize($"subnet-{armId}");
        }

        if (AzureInventoryTopologyCategory.IsVirtualNetworkArmType(armType))
        {
            if (!string.IsNullOrWhiteSpace(resourceGroup) && !string.IsNullOrWhiteSpace(subscriptionId))
            {
                return MermaidIdSanitizer.Sanitize($"rg-{subscriptionId}-{resourceGroup}");
            }
        }

        if (!string.IsNullOrWhiteSpace(resourceGroup) && !string.IsNullOrWhiteSpace(subscriptionId))
        {
            return MermaidIdSanitizer.Sanitize($"rg-{subscriptionId}-{resourceGroup}");
        }

        if (!string.IsNullOrWhiteSpace(subscriptionId))
        {
            return MermaidIdSanitizer.Sanitize($"sub-{subscriptionId}");
        }

        return subgraphs.FirstOrDefault()?.SubgraphId;
    }

    private static string FormatSubnetSubgraphLabel(string? label)
    {
        if (label is null)
        {
            return "Subnet name was not stored.";
        }

        if (label.Length == 0 || label.Trim().Length == 0)
        {
            return "Subnet name was stored empty.";
        }

        return $"Subnet {label.Trim()}";
    }

    private static string ReadParentVnetLabel(IReadOnlyList<GraphNode> nodes, string parentArmId)
    {
        GraphNode? parentVnet = nodes.FirstOrDefault(candidate =>
            string.Equals(DiagramAstGraphNodeClassifier.ReadArmId(candidate), parentArmId, StringComparison.OrdinalIgnoreCase));

        if (parentVnet is not null)
        {
            if (parentVnet.Label is null)
            {
                return FormatVnetArmSegmentFallback(parentArmId);
            }

            if (parentVnet.Label.Length == 0)
            {
                return "Virtual network name was stored empty.";
            }

            string trimmedLabel = parentVnet.Label.Trim();
            if (trimmedLabel.Length > 0)
            {
                return trimmedLabel;
            }

            return "Virtual network name was stored empty.";
        }

        return FormatVnetArmSegmentFallback(parentArmId);
    }

    private static string FormatVnetArmSegmentFallback(string parentArmId)
    {
        int nameStart = parentArmId.LastIndexOf('/');

        if (nameStart >= 0 && nameStart < parentArmId.Length - 1)
        {
            string armSegment = parentArmId[(nameStart + 1)..].Trim();
            if (armSegment.Length > 0)
            {
                return $"{armSegment} (ARM segment)";
            }
        }

        return "Virtual network name was not stored.";
    }

    private static void EnsureSubgraph(
        Dictionary<string, DiagramSubgraph> subgraphs,
        string subgraphId,
        string label,
        string? parentSubgraphId,
        int orderKey)
    {
        if (subgraphs.ContainsKey(subgraphId))
        {
            return;
        }

        subgraphs[subgraphId] = new DiagramSubgraph
        {
            SubgraphId = subgraphId,
            Label = label,
            ParentSubgraphId = parentSubgraphId,
            OrderKey = orderKey,
        };
    }
}
