using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

public sealed partial class DeclarationPremiseConflictFindingEngine
{
    private static IReadOnlyList<ApplicableIntentNode> ResolveApplicableIntentNodes(
        GraphSnapshot graphSnapshot,
        GraphNode topologyNode)
    {
        List<ApplicableIntentNode> narrowIntentNodes = CollectIncomingIntentNodes(
            graphSnapshot,
            topologyNode,
            GraphEdgeDecisioningThresholds.MinWeightForSemanticLink);

        if (narrowIntentNodes.Count > 0)
            return narrowIntentNodes;

        // Sub-threshold PROTECTS/APPLIES_TO edges still indicate narrow applicability; only fall back to
        // graph-wide intent when no explicit intent edge targets this resource.
        narrowIntentNodes = CollectIncomingIntentNodes(graphSnapshot, topologyNode, minWeightInclusive: 0d);

        if (narrowIntentNodes.Count > 0)
            return narrowIntentNodes;

        return graphSnapshot.Nodes
            .Where(IsIntentNode)
            .Select(node => new ApplicableIntentNode(node, false))
            .ToList();
    }

    private static List<ApplicableIntentNode> CollectIncomingIntentNodes(
        GraphSnapshot graphSnapshot,
        GraphNode topologyNode,
        double minWeightInclusive)
    {
        List<ApplicableIntentNode> narrowIntentNodes = [];
        HashSet<string> seenIntentNodeIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (string edgeType in new[] { GraphEdgeTypes.Protects, GraphEdgeTypes.AppliesTo })
        {
            foreach (GraphNode source in GetIncomingSourcesWithMinWeight(
                         graphSnapshot,
                         topologyNode.NodeId,
                         edgeType,
                         minWeightInclusive))
            {
                if (!IsIntentNode(source))
                    continue;

                if (!seenIntentNodeIds.Add(source.NodeId))
                    continue;

                narrowIntentNodes.Add(new ApplicableIntentNode(source, true));
            }
        }

        return narrowIntentNodes;
    }

    private static IReadOnlyList<GraphNode> GetIncomingSourcesWithMinWeight(
        GraphSnapshot graphSnapshot,
        string toNodeId,
        string edgeType,
        double minWeightInclusive)
    {
        HashSet<string> sourceIds = graphSnapshot.Edges
            .Where(edge =>
                string.Equals(edge.ToNodeId, toNodeId, StringComparison.OrdinalIgnoreCase)
                && string.Equals(edge.EdgeType, edgeType, StringComparison.OrdinalIgnoreCase)
                && edge.Weight >= minWeightInclusive)
            .Select(edge => edge.FromNodeId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return graphSnapshot.Nodes
            .Where(node => sourceIds.Contains(node.NodeId))
            .ToList();
    }

    private static bool IsIntentNode(GraphNode node) =>
        string.Equals(node.NodeType, GraphNodeTypes.SecurityBaseline, StringComparison.OrdinalIgnoreCase)
        || string.Equals(node.NodeType, GraphNodeTypes.PolicyControl, StringComparison.OrdinalIgnoreCase);
}
