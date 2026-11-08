using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class DiagramDataFlowEdgeFilter
{
    public static bool IncludeEdge(GraphEdge edge)
    {
        ArgumentNullException.ThrowIfNull(edge);

        if (edge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
        {
            return false;
        }

        if (string.Equals(edge.EdgeType, GraphEdgeTypes.Contains, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, GraphEdgeTypes.ContainsResource, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryObservedDependency, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return AzureInventoryDataFlowEvidenceCatalog.IncludeOnDataFlow(edge.EdgeType, edge.InferenceSource);
    }
}
