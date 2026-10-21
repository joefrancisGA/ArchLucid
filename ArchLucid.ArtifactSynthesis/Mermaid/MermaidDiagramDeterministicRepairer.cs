using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

public sealed class MermaidDiagramDeterministicRepairer : IMermaidDiagramDeterministicRepairer
{
    public DiagramAst Repair(DiagramAst ast, out MermaidDiagramCollapseReport collapseReport)
    {
        ArgumentNullException.ThrowIfNull(ast);

        List<MermaidDiagramCollapseEntry> collapseEntries = [];
        Dictionary<string, string> nodeIdMap = new(StringComparer.Ordinal);
        List<DiagramNode> repairedNodes = [];
        HashSet<string> seenNodeIds = new(StringComparer.Ordinal);

        foreach (DiagramNode node in ast.Nodes.OrderBy(node => node.OrderKey).ThenBy(node => node.NodeId, StringComparer.Ordinal))
        {
            string sanitizedId = MermaidIdSanitizer.Sanitize(node.NodeId);

            if (!seenNodeIds.Add(sanitizedId))
            {
                collapseEntries.Add(new MermaidDiagramCollapseEntry
                {
                    Kind = "DuplicateNodeId",
                    NodeId = node.NodeId,
                    CloudResourceId = node.CloudResourceId,
                    Reason = "Duplicate node id collapsed during deterministic repair.",
                });

                continue;
            }

            nodeIdMap[node.NodeId] = sanitizedId;
            repairedNodes.Add(DiagramNodeStructuralCopy.With(
                node,
                clone =>
                {
                    clone.NodeId = sanitizedId;
                    clone.Label = TruncateLabel(MermaidDiagramRenderer.EscapeLabel(node.Label));
                    clone.SubgraphId = string.IsNullOrWhiteSpace(node.SubgraphId)
                        ? null
                        : MermaidIdSanitizer.Sanitize(node.SubgraphId);
                }));
        }

        HashSet<string> seenEdges = new(StringComparer.Ordinal);
        List<DiagramEdge> repairedEdges = [];

        foreach (DiagramEdge edge in ast.Edges)
        {
            if (!nodeIdMap.TryGetValue(edge.FromNodeId, out string? fromId)
                || !nodeIdMap.TryGetValue(edge.ToNodeId, out string? toId))
            {
                continue;
            }

            string label = TruncateLabel(MermaidDiagramRenderer.EscapeLabel(edge.Label ?? string.Empty));
            string edgeKey = $"{fromId}|{toId}|{label}";

            if (!seenEdges.Add(edgeKey))
            {
                collapseEntries.Add(new MermaidDiagramCollapseEntry
                {
                    Kind = "DuplicateEdge",
                    Reason = $"Duplicate edge collapsed: {fromId} -> {toId}",
                });

                continue;
            }

            repairedEdges.Add(DiagramEdgeStructuralCopy.With(
                edge,
                clone =>
                {
                    clone.FromNodeId = fromId;
                    clone.ToNodeId = toId;
                    clone.Label = label;
                }));
        }

        List<DiagramSubgraph> repairedSubgraphs = ast.Subgraphs
            .Select(subgraph => DiagramSubgraphStructuralCopy.With(
                subgraph,
                clone =>
                {
                    clone.SubgraphId = MermaidIdSanitizer.Sanitize(subgraph.SubgraphId);
                    clone.Label = TruncateLabel(MermaidDiagramRenderer.EscapeLabel(subgraph.Label));
                    clone.ParentSubgraphId = string.IsNullOrWhiteSpace(subgraph.ParentSubgraphId)
                        ? null
                        : MermaidIdSanitizer.Sanitize(subgraph.ParentSubgraphId);
                }))
            .ToList();

        collapseReport = new MermaidDiagramCollapseReport { Entries = collapseEntries };

        return DiagramAstStructuralCopy.With(
            ast,
            repaired =>
            {
                repaired.Nodes = repairedNodes;
                repaired.Edges = repairedEdges;
                repaired.Subgraphs = repairedSubgraphs;
            });
    }

    private static string TruncateLabel(string label)
    {
        const int maxLength = 120;

        if (label.Length <= maxLength)
        {
            return label;
        }

        return label[..maxLength];
    }
}
