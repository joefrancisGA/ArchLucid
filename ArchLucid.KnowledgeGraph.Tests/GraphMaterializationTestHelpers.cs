using ArchLucid.KnowledgeGraph.Builders;
using ArchLucid.KnowledgeGraph.Diagram;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.KnowledgeGraph.Mapping;
using ArchLucid.KnowledgeGraph.Materialization;

namespace ArchLucid.KnowledgeGraph.Tests;

internal static class GraphMaterializationTestHelpers
{
    public static StructuredDiagramGraphMerger CreateStructuredDiagramGraphMerger()
    {
        return new StructuredDiagramGraphMerger(new ArchitectureDiagramToGraphCompiler());
    }

    public static GraphMaterializationPipeline CreateDefaultPipeline(IGraphNodeFactory nodeFactory)
    {
        return GraphMaterializationStages.CreateDefaultPipeline(
            nodeFactory,
            CreateStructuredDiagramGraphMerger());
    }

    public static DefaultGraphBuilder CreateDefaultGraphBuilder(
        IGraphNodeFactory nodeFactory,
        IGraphEdgeInferer edgeInferer)
    {
        return new DefaultGraphBuilder(nodeFactory, edgeInferer, CreateStructuredDiagramGraphMerger());
    }
}
