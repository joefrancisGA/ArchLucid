using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Findings;
using ArchLucid.KnowledgeGraph.Diagram;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Builds a package-scoped <see cref="DiagramPackageCitationIndex" /> from compiled diagram graph nodes (AS-022 / QR-09).
/// </summary>
public static class DiagramPackageCitationIndexBuilder
{
    private const string DiagramNodeIdPrefix = "diagram-node:";

    public static DiagramPackageCitationIndex FromGraphSnapshot(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        if (graphSnapshot.Nodes is null || graphSnapshot.Nodes.Count == 0)
        {
            return DiagramPackageCitationIndex.FromModels([]);
        }

        Dictionary<string, DiagramModelAccumulator> accumulators =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in graphSnapshot.Nodes)
        {
            if (!TryGetShapeId(node, out string? shapeId) || string.IsNullOrWhiteSpace(shapeId))
            {
                continue;
            }

            string evidenceItemId = ResolveEvidenceItemId(node);
            DiagramModelAccumulator accumulator = GetOrCreateAccumulator(accumulators, evidenceItemId);
            accumulator.AddNode(shapeId);
        }

        if (graphSnapshot.Edges is not null)
        {
            foreach (GraphEdge edge in graphSnapshot.Edges)
            {
                if (edge.Properties is null)
                {
                    continue;
                }

                if (!edge.Properties.TryGetValue(StructuredDiagramGraphPropertyKeys.DiagramEdgeId, out string? edgeId)
                    || string.IsNullOrWhiteSpace(edgeId))
                {
                    continue;
                }

                string evidenceItemId = ResolveEvidenceItemId(edge.Properties);
                DiagramModelAccumulator accumulator = GetOrCreateAccumulator(accumulators, evidenceItemId);
                accumulator.AddEdge(edgeId.Trim());
            }
        }

        List<ArchitectureDiagramModelRecord> models = accumulators.Values
            .Select(static accumulator => accumulator.ToModel())
            .ToList();

        return DiagramPackageCitationIndex.FromModels(models);
    }

    private static DiagramModelAccumulator GetOrCreateAccumulator(
        Dictionary<string, DiagramModelAccumulator> accumulators,
        string evidenceItemId)
    {
        if (!accumulators.TryGetValue(evidenceItemId, out DiagramModelAccumulator? accumulator))
        {
            accumulator = new DiagramModelAccumulator(evidenceItemId);
            accumulators[evidenceItemId] = accumulator;
        }

        return accumulator;
    }

    private static string ResolveEvidenceItemId(GraphNode node)
    {
        if (node.Properties is not null
            && node.Properties.TryGetValue(StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId, out string? evidenceItemId)
            && !string.IsNullOrWhiteSpace(evidenceItemId))
        {
            return evidenceItemId.Trim();
        }

        return string.Empty;
    }

    private static string ResolveEvidenceItemId(IReadOnlyDictionary<string, string> properties)
    {
        if (properties.TryGetValue(StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId, out string? evidenceItemId)
            && !string.IsNullOrWhiteSpace(evidenceItemId))
        {
            return evidenceItemId.Trim();
        }

        return string.Empty;
    }

    private static bool TryGetShapeId(GraphNode node, out string? shapeId)
    {
        shapeId = null;

        if (node.Properties is not null
            && node.Properties.TryGetValue(StructuredDiagramGraphPropertyKeys.BoundDiagramNodeId, out string? boundId)
            && !string.IsNullOrWhiteSpace(boundId))
        {
            shapeId = boundId.Trim();
            return true;
        }

        if (string.Equals(node.SourceType, StructuredDiagramGraphSourceTypes.StructuredDiagram, StringComparison.Ordinal)
            || node.NodeId.StartsWith(DiagramNodeIdPrefix, StringComparison.Ordinal))
        {
            if (!string.IsNullOrWhiteSpace(node.SourceId))
            {
                shapeId = node.SourceId.Trim();
                return true;
            }

            if (node.NodeId.StartsWith(DiagramNodeIdPrefix, StringComparison.Ordinal))
            {
                shapeId = node.NodeId[DiagramNodeIdPrefix.Length..].Trim();
                return !string.IsNullOrWhiteSpace(shapeId);
            }
        }

        return false;
    }

    private sealed class DiagramModelAccumulator(string evidenceItemId)
    {
        private readonly string _evidenceItemId = evidenceItemId ?? string.Empty;

        private readonly HashSet<string> _nodeIds = new(StringComparer.OrdinalIgnoreCase);

        private readonly HashSet<string> _edgeIds = new(StringComparer.OrdinalIgnoreCase);

        public void AddNode(string shapeId)
        {
            _nodeIds.Add(shapeId);
        }

        public void AddEdge(string edgeId)
        {
            _edgeIds.Add(edgeId);
        }

        public ArchitectureDiagramModelRecord ToModel()
        {
            return new ArchitectureDiagramModelRecord
            {
                SourceEvidenceItemId = string.IsNullOrWhiteSpace(_evidenceItemId) ? null : _evidenceItemId,
                ExtractionMethod = DiagramExtractionMethods.StructuredParse,
                Nodes = _nodeIds
                    .Select(static nodeId => new ArchitectureDiagramNodeRecord
                    {
                        Id = nodeId,
                        Label = nodeId,
                    })
                    .ToList(),
                Edges = _edgeIds
                    .Select(static edgeId => new ArchitectureDiagramEdgeRecord
                    {
                        Id = edgeId,
                    })
                    .ToList(),
            };
        }
    }
}
