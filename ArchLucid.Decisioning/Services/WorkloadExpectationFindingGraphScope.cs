using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

internal static class WorkloadExpectationFindingGraphScope
{
    internal static List<string> CollectScopeNodeIds(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        List<string> nodeIds = [];

        foreach (GraphNode node in graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource))
            nodeIds.Add(node.NodeId);

        foreach (GraphNode node in graphSnapshot.GetNodesByType(GraphNodeTypes.ContextSnapshot))
            nodeIds.Add(node.NodeId);

        foreach (GraphNode node in graphSnapshot.GetNodesByType(GraphNodeTypes.Requirement))
            nodeIds.Add(node.NodeId);

        foreach (GraphNode node in graphSnapshot.GetNodesByType(GraphNodeTypes.SecurityBaseline))
            nodeIds.Add(node.NodeId);

        return nodeIds;
    }
}
