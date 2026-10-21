using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>
///     Edge clone/merge helpers for data-flow rollup (structural copy entry points).
/// </summary>
internal static class DiagramForestDataFlowRollupStructuralCopy
{
    internal static DiagramEdge CloneEdge(DiagramEdge source, string fromNodeId, string toNodeId)
    {
        return DiagramEdgeStructuralCopy.With(
            source,
            edge =>
            {
                edge.FromNodeId = fromNodeId;
                edge.ToNodeId = toNodeId;
            });
    }

    internal static DiagramEdge MergeParallelRollupEdges(DiagramEdge existing, DiagramEdge incoming)
    {
        ArgumentNullException.ThrowIfNull(existing);
        ArgumentNullException.ThrowIfNull(incoming);

        List<string> mergedLabels = existing.DataFlowNsgAnnotationLabels
            .Concat(incoming.DataFlowNsgAnnotationLabels)
            .Where(label => !string.IsNullOrWhiteSpace(label))
            .Select(label => label.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(label => label, StringComparer.OrdinalIgnoreCase)
            .ToList();
        List<string> mergedRuleDetails = existing.DataFlowNsgSupportingRuleDetails
            .Concat(incoming.DataFlowNsgSupportingRuleDetails)
            .Where(detail => !string.IsNullOrWhiteSpace(detail))
            .Select(detail => detail.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToList();

        return DiagramEdgeStructuralCopy.With(
            existing,
            edge =>
            {
                edge.IsDataFlowNsgBlocked = existing.IsDataFlowNsgBlocked || incoming.IsDataFlowNsgBlocked;
                edge.DataFlowNsgAnnotationLabels = mergedLabels;
                edge.DataFlowNsgSupportingRuleDetails = mergedRuleDetails;
            });
    }
}
