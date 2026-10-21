namespace ArchLucid.ArtifactSynthesis.Models;

/// <summary>
///     Properties allowed to change when a diagram model rebuild path runs (documented for architecture tests).
/// </summary>
internal static class DiagramModelStructuralCopyExemptions
{
    internal const string DiagramNodeStructuralCopyClone = "DiagramNodeStructuralCopy.Clone";

    internal const string DiagramEdgeStructuralCopyClone = "DiagramEdgeStructuralCopy.Clone";

    internal const string DiagramSubgraphStructuralCopyClone = "DiagramSubgraphStructuralCopy.Clone";

    internal const string DiagramAstStructuralCopyClone = "DiagramAstStructuralCopy.Clone";

    internal const string MermaidDiagramDeterministicRepairerNode = "MermaidDiagramDeterministicRepairer.RepairNode";

    internal const string MermaidDiagramDeterministicRepairerEdge = "MermaidDiagramDeterministicRepairer.RepairEdge";

    internal const string MermaidDiagramDeterministicRepairerSubgraph = "MermaidDiagramDeterministicRepairer.RepairSubgraph";

    internal const string MermaidDiagramDeterministicRepairerAst = "MermaidDiagramDeterministicRepairer.RepairAst";

    internal const string DiagramForestDataFlowRollupCloneEdge = "DiagramForestDataFlowRollup.CloneEdge";

    internal const string DiagramForestDataFlowRollupMergeParallelRollupEdges =
        "DiagramForestDataFlowRollup.MergeParallelRollupEdges";

    internal static IReadOnlyDictionary<string, IReadOnlySet<string>> PropertyExemptions { get; } =
        new Dictionary<string, IReadOnlySet<string>>(StringComparer.Ordinal)
        {
            [DiagramNodeStructuralCopyClone] = new HashSet<string>(StringComparer.Ordinal),
            [DiagramEdgeStructuralCopyClone] = new HashSet<string>(StringComparer.Ordinal),
            [DiagramSubgraphStructuralCopyClone] = new HashSet<string>(StringComparer.Ordinal),
            [DiagramAstStructuralCopyClone] = new HashSet<string>(StringComparer.Ordinal),
            [MermaidDiagramDeterministicRepairerNode] = new HashSet<string>(StringComparer.Ordinal)
            {
                nameof(DiagramNode.NodeId),
                nameof(DiagramNode.Label),
                nameof(DiagramNode.SubgraphId),
            },
            [MermaidDiagramDeterministicRepairerEdge] = new HashSet<string>(StringComparer.Ordinal)
            {
                nameof(DiagramEdge.FromNodeId),
                nameof(DiagramEdge.ToNodeId),
                nameof(DiagramEdge.Label),
            },
            [MermaidDiagramDeterministicRepairerSubgraph] = new HashSet<string>(StringComparer.Ordinal)
            {
                nameof(DiagramSubgraph.SubgraphId),
                nameof(DiagramSubgraph.Label),
                nameof(DiagramSubgraph.ParentSubgraphId),
            },
            [MermaidDiagramDeterministicRepairerAst] = new HashSet<string>(StringComparer.Ordinal)
            {
                nameof(DiagramAst.Nodes),
                nameof(DiagramAst.Edges),
                nameof(DiagramAst.Subgraphs),
            },
            [DiagramForestDataFlowRollupCloneEdge] = new HashSet<string>(StringComparer.Ordinal)
            {
                nameof(DiagramEdge.FromNodeId),
                nameof(DiagramEdge.ToNodeId),
            },
            [DiagramForestDataFlowRollupMergeParallelRollupEdges] = new HashSet<string>(StringComparer.Ordinal)
            {
                nameof(DiagramEdge.IsDataFlowNsgBlocked),
                nameof(DiagramEdge.DataFlowNsgAnnotationLabels),
                nameof(DiagramEdge.DataFlowNsgSupportingRuleDetails),
            },
        };

    internal static bool IsExempt(string rebuildPathId, string propertyName)
    {
        if (!PropertyExemptions.TryGetValue(rebuildPathId, out IReadOnlySet<string>? exemptions))
            return false;

        return exemptions.Contains(propertyName);
    }
}
