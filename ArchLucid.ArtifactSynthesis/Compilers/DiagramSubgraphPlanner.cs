using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;

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

            if (armType.Contains("/virtualnetworks/", StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(resourceGroup)
                && !string.IsNullOrWhiteSpace(subscriptionId))
            {
                string vnetSubgraphId = MermaidIdSanitizer.Sanitize($"vnet-{armId}");
                string parentSubgraphId = MermaidIdSanitizer.Sanitize($"rg-{subscriptionId}-{resourceGroup}");

                EnsureSubgraph(
                    subgraphs,
                    vnetSubgraphId,
                    $"VNet {node.Label}",
                    parentSubgraphId,
                    orderKey: 2);

                nodeSubgraphAssignments[node.NodeId] = vnetSubgraphId;
            }

            if (armType.Contains("/subnets/", StringComparison.OrdinalIgnoreCase))
            {
                string? parentArmId = node.Properties.TryGetValue("arm.parentId", out string? parentId) ? parentId : null;

                if (!string.IsNullOrWhiteSpace(parentArmId))
                {
                    string subnetSubgraphId = MermaidIdSanitizer.Sanitize($"subnet-{armId}");
                    string parentSubgraphId = MermaidIdSanitizer.Sanitize($"vnet-{parentArmId}");

                    EnsureSubgraph(
                        subgraphs,
                        subnetSubgraphId,
                        $"Subnet {node.Label}",
                        parentSubgraphId,
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

        if (armType.Contains("/subnets/", StringComparison.OrdinalIgnoreCase))
        {
            return MermaidIdSanitizer.Sanitize($"subnet-{armId}");
        }

        if (armType.Contains("/virtualnetworks/", StringComparison.OrdinalIgnoreCase))
        {
            return MermaidIdSanitizer.Sanitize($"vnet-{armId}");
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
