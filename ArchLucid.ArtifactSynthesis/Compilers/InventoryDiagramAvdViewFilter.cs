using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Omits AVD-only inventory nodes from general and data-flow diagram projections (NR-06).</summary>
internal static class InventoryDiagramAvdViewFilter
{
    public static List<GraphNode> ExcludeAvdOnlyNodes(GraphSnapshot graph, List<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(nodes);

        InventoryDiagramAvdScopeResult scope = InventoryDiagramAvdScopeResolver.Resolve(graph);

        return nodes
            .Where(node => !scope.AvdOnlyNodeIds.Contains(node.NodeId))
            .ToList();
    }

    public static List<GraphNode> IncludeAvdDiagramNodes(GraphSnapshot graph, List<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(nodes);

        InventoryDiagramAvdScopeResult scope = InventoryDiagramAvdScopeResolver.Resolve(graph);
        HashSet<string> includedNodeIds = scope.AvdOnlyNodeIds
            .Union(scope.SharedBoundaryNodeIds)
            .ToHashSet(StringComparer.Ordinal);

        return nodes
            .Where(node => includedNodeIds.Contains(node.NodeId))
            .ToList();
    }

    public static bool ShouldApply(DiagramMode mode)
    {
        return mode != DiagramMode.Avd;
    }
}
