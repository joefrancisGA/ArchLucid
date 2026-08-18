using System.Globalization;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Costing;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>TB-2348: writes topology-estimated projected spend onto cost-constraint nodes.</summary>
public static class CostConstraintProjectedSpendEnricher
{
    public static async Task EnrichFromTopologyAsync(
        IList<GraphNode> nodes,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        List<GraphNode> topologyNodes = nodes
            .Where(node => string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (topologyNodes.Count == 0)
            return;

        List<InfrastructureCostQueryNode> queryNodes = GraphTopologyInfrastructureCostNodes.FromGraphTopologyNodes(topologyNodes);

        if (queryNodes.Count == 0)
            return;

        InfrastructureMonthlyUsdCostEstimator estimator = new(null);
        InfrastructureCostEstimateTotals totals = await estimator.EstimateNodesAsync(
            queryNodes,
            attemptRetailPricing: false,
            retailPrices: null,
            cancellationToken).ConfigureAwait(false);

        if (totals.TotalUsdPerMonth <= 0m)
            return;

        decimal projected = totals.TotalUsdPerMonth;
        decimal lowerBound = Math.Round(projected * 0.9m, 2, MidpointRounding.AwayFromZero);
        decimal upperBound = Math.Round(projected * 1.1m, 2, MidpointRounding.AwayFromZero);
        string projectedText = projected.ToString(CultureInfo.InvariantCulture);
        string lowerText = lowerBound.ToString(CultureInfo.InvariantCulture);
        string upperText = upperBound.ToString(CultureInfo.InvariantCulture);
        string confidenceReasoning = totals.AnyRetailPricing
            ? "Topology-derived projected monthly spend (retail blend)."
            : "Topology-derived projected monthly spend (illustrative fallback).";

        foreach (GraphNode node in nodes)
        {
            if (!string.Equals(node.NodeType, GraphNodeTypes.CostConstraint, StringComparison.OrdinalIgnoreCase))
                continue;

            if (HasProjectedSpend(node))
                continue;

            node.Properties["projectedMonthlySpendUsd"] = projectedText;
            node.Properties["projectedImpactUsdLowerBound"] = lowerText;
            node.Properties["projectedImpactUsdUpperBound"] = upperText;
            node.Properties["confidenceReasoning"] = confidenceReasoning;
        }
    }

    private static bool HasProjectedSpend(GraphNode node)
    {
        if (node.Properties.ContainsKey("projectedMonthlySpendUsd"))
            return true;

        if (node.Properties.ContainsKey("projectedImpactUsdUpperBound"))
            return true;

        if (node.Properties.ContainsKey("projectedImpactUsdLowerBound"))
            return true;

        return false;
    }
}

/// <summary>TB-2348: maps topology graph nodes to infrastructure cost query rows.</summary>
internal static class GraphTopologyInfrastructureCostNodes
{
    public static List<InfrastructureCostQueryNode> FromGraphTopologyNodes(IReadOnlyList<GraphNode> topologyNodes)
    {
        ArgumentNullException.ThrowIfNull(topologyNodes);

        List<InfrastructureCostQueryNode> nodes = [];

        foreach (GraphNode topologyNode in topologyNodes)
        {
            RuntimePlatform platform = ResolveRuntimePlatform(topologyNode);
            string displayName = string.IsNullOrWhiteSpace(topologyNode.Label) ? "(topology resource)" : topologyNode.Label.Trim();
            string? region = ReadProperty(topologyNode, "armRegion", "azureArmRegion", "region");
            string? sku = ReadProperty(topologyNode, "sku", "azurePricingSku", "pricingSku");
            int quantity = TryReadQuantity(topologyNode);

            nodes.Add(new InfrastructureCostQueryNode(
                topologyNode.Category ?? "TopologyResource",
                displayName,
                platform,
                region,
                sku,
                quantity));
        }

        return nodes;
    }

    private static RuntimePlatform ResolveRuntimePlatform(GraphNode topologyNode)
    {
        string? platformRaw = ReadProperty(topologyNode, "runtimePlatform", "platform");

        if (!string.IsNullOrWhiteSpace(platformRaw)
            && Enum.TryParse(platformRaw, ignoreCase: true, out RuntimePlatform parsed))
        {
            return parsed;
        }

        string category = topologyNode.Category ?? string.Empty;

        if (string.Equals(category, GraphTopologyCategories.Compute, StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.Vm;

        if (string.Equals(category, GraphTopologyCategories.Data, StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.SqlServer;

        if (string.Equals(category, GraphTopologyCategories.Storage, StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.BlobStorage;

        if (string.Equals(category, GraphTopologyCategories.Identity, StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.KeyVault;

        return RuntimePlatform.Unknown;
    }

    private static int TryReadQuantity(GraphNode topologyNode)
    {
        string? quantityRaw = ReadProperty(topologyNode, "instanceCount", "quantity");

        if (string.IsNullOrWhiteSpace(quantityRaw))
            return 1;

        if (int.TryParse(quantityRaw, out int quantity) && quantity > 0)
            return quantity;

        return 1;
    }

    private static string? ReadProperty(GraphNode topologyNode, params string[] keys)
    {
        foreach (string key in keys)
        {
            if (topologyNode.Properties.TryGetValue(key, out string? value) && !string.IsNullOrWhiteSpace(value))
                return value.Trim();
        }

        return null;
    }
}
