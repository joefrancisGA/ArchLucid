using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Mermaid;

namespace ArchLucid.ArtifactSynthesis.Models;

/// <summary>
///     Invokes each diagram-model rebuild path for architecture coverage tests.
/// </summary>
internal static class DiagramModelRebuildPathInvoker
{
    internal static DiagramNode InvokeNodePath(string rebuildPathId, DiagramNode source)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(rebuildPathId);
        ArgumentNullException.ThrowIfNull(source);

        return rebuildPathId switch
        {
            DiagramModelStructuralCopyExemptions.DiagramNodeStructuralCopyClone =>
                DiagramNodeStructuralCopy.Clone(source),
            DiagramModelStructuralCopyExemptions.MermaidDiagramDeterministicRepairerNode =>
                RepairSingleNode(source),
            _ => throw new ArgumentOutOfRangeException(nameof(rebuildPathId), rebuildPathId, "Unknown node rebuild path."),
        };
    }

    internal static DiagramEdge InvokeEdgePath(string rebuildPathId, DiagramEdge source)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(rebuildPathId);
        ArgumentNullException.ThrowIfNull(source);

        return rebuildPathId switch
        {
            DiagramModelStructuralCopyExemptions.DiagramEdgeStructuralCopyClone =>
                DiagramEdgeStructuralCopy.Clone(source),
            DiagramModelStructuralCopyExemptions.MermaidDiagramDeterministicRepairerEdge =>
                RepairSingleEdge(source),
            DiagramModelStructuralCopyExemptions.DiagramForestDataFlowRollupCloneEdge =>
                DiagramForestDataFlowRollupStructuralCopy.CloneEdge(source, "remapped_from", "remapped_to"),
            DiagramModelStructuralCopyExemptions.DiagramForestDataFlowRollupMergeParallelRollupEdges =>
                DiagramForestDataFlowRollupStructuralCopy.MergeParallelRollupEdges(
                    source,
                    DiagramEdgeStructuralCopy.With(source, edge => edge.IsDataFlowNsgBlocked = !source.IsDataFlowNsgBlocked)),
            _ => throw new ArgumentOutOfRangeException(nameof(rebuildPathId), rebuildPathId, "Unknown edge rebuild path."),
        };
    }

    internal static DiagramSubgraph InvokeSubgraphPath(string rebuildPathId, DiagramSubgraph source)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(rebuildPathId);
        ArgumentNullException.ThrowIfNull(source);

        return rebuildPathId switch
        {
            DiagramModelStructuralCopyExemptions.DiagramSubgraphStructuralCopyClone =>
                DiagramSubgraphStructuralCopy.Clone(source),
            DiagramModelStructuralCopyExemptions.MermaidDiagramDeterministicRepairerSubgraph =>
                RepairSingleSubgraph(source),
            _ => throw new ArgumentOutOfRangeException(nameof(rebuildPathId), rebuildPathId, "Unknown subgraph rebuild path."),
        };
    }

    internal static DiagramAst InvokeAstPath(string rebuildPathId, DiagramAst source)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(rebuildPathId);
        ArgumentNullException.ThrowIfNull(source);

        return rebuildPathId switch
        {
            DiagramModelStructuralCopyExemptions.DiagramAstStructuralCopyClone =>
                DiagramAstStructuralCopy.Clone(source),
            DiagramModelStructuralCopyExemptions.MermaidDiagramDeterministicRepairerAst =>
                new MermaidDiagramDeterministicRepairer().Repair(source, out _),
            _ => throw new ArgumentOutOfRangeException(nameof(rebuildPathId), rebuildPathId, "Unknown AST rebuild path."),
        };
    }

    internal static IEnumerable<string> NodeRebuildPathIds()
    {
        yield return DiagramModelStructuralCopyExemptions.DiagramNodeStructuralCopyClone;
        yield return DiagramModelStructuralCopyExemptions.MermaidDiagramDeterministicRepairerNode;
    }

    internal static IEnumerable<string> EdgeRebuildPathIds()
    {
        yield return DiagramModelStructuralCopyExemptions.DiagramEdgeStructuralCopyClone;
        yield return DiagramModelStructuralCopyExemptions.MermaidDiagramDeterministicRepairerEdge;
        yield return DiagramModelStructuralCopyExemptions.DiagramForestDataFlowRollupCloneEdge;
        yield return DiagramModelStructuralCopyExemptions.DiagramForestDataFlowRollupMergeParallelRollupEdges;
    }

    internal static IEnumerable<string> SubgraphRebuildPathIds()
    {
        yield return DiagramModelStructuralCopyExemptions.DiagramSubgraphStructuralCopyClone;
        yield return DiagramModelStructuralCopyExemptions.MermaidDiagramDeterministicRepairerSubgraph;
    }

    internal static IEnumerable<string> AstRebuildPathIds()
    {
        yield return DiagramModelStructuralCopyExemptions.DiagramAstStructuralCopyClone;
        yield return DiagramModelStructuralCopyExemptions.MermaidDiagramDeterministicRepairerAst;
    }

    private static DiagramNode RepairSingleNode(DiagramNode source)
    {
        DiagramAst ast = new()
        {
            Title = "probe",
            Nodes = [source],
        };

        return new MermaidDiagramDeterministicRepairer().Repair(ast, out _).Nodes.Single();
    }

    private static DiagramEdge RepairSingleEdge(DiagramEdge source)
    {
        DiagramNode from = DiagramModelPropertyProbeFactory.CreatePopulatedDiagramNode();
        from.NodeId = source.FromNodeId;
        DiagramNode to = DiagramModelPropertyProbeFactory.CreatePopulatedDiagramNode();
        to.NodeId = source.ToNodeId;

        DiagramAst ast = new()
        {
            Title = "probe",
            Nodes = [from, to],
            Edges = [source],
        };

        return new MermaidDiagramDeterministicRepairer().Repair(ast, out _).Edges.Single();
    }

    private static DiagramSubgraph RepairSingleSubgraph(DiagramSubgraph source)
    {
        DiagramAst ast = new()
        {
            Title = "probe",
            Subgraphs = [source],
        };

        return new MermaidDiagramDeterministicRepairer().Repair(ast, out _).Subgraphs.Single();
    }
}
