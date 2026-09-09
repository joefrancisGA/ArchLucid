using ArchLucid.Contracts.Architecture;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Diagram;

namespace ArchLucid.ContextIngestion.Mapping;

/// <summary>
///     Maps <see cref="ArchitectureDiagramModelRecord" /> into context-ingestion <see cref="CanonicalObject" /> rows (AS-007).
/// </summary>
public static class ArchitectureDiagramCanonicalObjectMapper
{
    public const string StructuredDiagramSourceType = StructuredDiagramCanonicalSourceTypes.StructuredDiagram;

    public static IReadOnlyList<CanonicalObject> Map(
        ArchitectureDiagramModelRecord model,
        string documentId,
        double labelOnlyInferenceConfidence)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentException.ThrowIfNullOrWhiteSpace(documentId);

        if (model.Nodes.Count == 0)
        {
            return [];
        }

        Dictionary<string, string> objectIdByDiagramNodeId = new(StringComparer.Ordinal);
        List<CanonicalObject> results = [];

        foreach (ArchitectureDiagramNodeRecord node in model.Nodes)
        {
            if (node.Removed)
            {
                continue;
            }

            string objectId = ContextIngestionStableLineNames.StableObjectId(
                StructuredDiagramSourceType,
                $"{documentId}:{node.Id.Trim()}");

            objectIdByDiagramNodeId[node.Id.Trim()] = objectId;

            results.Add(BuildNodeObject(model, documentId, node, objectId, labelOnlyInferenceConfidence));
        }

        ApplyEdgeConnectivity(model, results, objectIdByDiagramNodeId);

        return results;
    }

    private static CanonicalObject BuildNodeObject(
        ArchitectureDiagramModelRecord model,
        string documentId,
        ArchitectureDiagramNodeRecord node,
        string objectId,
        double labelOnlyInferenceConfidence)
    {
        string label = string.IsNullOrWhiteSpace(node.Label) ? node.Id.Trim() : node.Label.Trim();
        double confidence = string.Equals(
            node.Provenance,
            ArchitectureDiagramProvenanceKinds.Asserted,
            StringComparison.Ordinal)
            ? 1d
            : labelOnlyInferenceConfidence;

        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["text"] = label,
            ["diagramNodeId"] = node.Id.Trim(),
            ["diagramNodeKind"] = node.Kind,
            ["extractionMethod"] = model.ExtractionMethod,
            ["inferenceConfidence"] = confidence.ToString("0.###"),
        };

        if (!string.IsNullOrWhiteSpace(node.SubgraphId))
        {
            properties["diagramSubgraphId"] = node.SubgraphId.Trim();
        }

        if (!string.IsNullOrWhiteSpace(model.SourceEvidenceItemId))
        {
            properties["sourceEvidenceItemId"] = model.SourceEvidenceItemId.Trim();
        }

        return new CanonicalObject
        {
            ObjectId = objectId,
            ObjectType = MapDiagramNodeKindToObjectType(node.Kind),
            Name = ContextIngestionStableLineNames.BuildDisplayName(label),
            SourceType = StructuredDiagramSourceType,
            SourceId = documentId,
            Properties = properties,
        };
    }

    private static void ApplyEdgeConnectivity(
        ArchitectureDiagramModelRecord model,
        List<CanonicalObject> objects,
        Dictionary<string, string> objectIdByDiagramNodeId)
    {
        Dictionary<string, List<string>> connectedTargetsBySource = new(StringComparer.Ordinal);

        foreach (ArchitectureDiagramEdgeRecord edge in model.Edges)
        {
            if (edge.Removed)
            {
                continue;
            }

            string sourceId = edge.SourceId.Trim();
            string targetId = edge.TargetId.Trim();

            if (!objectIdByDiagramNodeId.TryGetValue(sourceId, out string? sourceObjectId)
                || !objectIdByDiagramNodeId.TryGetValue(targetId, out string? targetObjectId))
            {
                continue;
            }

            if (!connectedTargetsBySource.TryGetValue(sourceObjectId, out List<string>? targets))
            {
                targets = [];
                connectedTargetsBySource[sourceObjectId] = targets;
            }

            targets.Add($"obj-{targetObjectId}");
        }

        if (connectedTargetsBySource.Count == 0)
        {
            return;
        }

        foreach (CanonicalObject canonicalObject in objects)
        {
            if (!string.Equals(
                    canonicalObject.ObjectType,
                    GraphNodeTypes.TopologyResource,
                    StringComparison.OrdinalIgnoreCase)
                || !connectedTargetsBySource.TryGetValue(canonicalObject.ObjectId, out List<string>? targets))
            {
                continue;
            }

            canonicalObject.Properties["connectedToNodeIds"] = string.Join(
                ',',
                targets.Distinct(StringComparer.OrdinalIgnoreCase));
        }
    }

    private static string MapDiagramNodeKindToObjectType(string kind)
    {
        if (string.Equals(kind, ArchitectureDiagramNodeKinds.User, StringComparison.OrdinalIgnoreCase))
        {
            return GraphNodeTypes.Actor;
        }

        if (string.Equals(kind, ArchitectureDiagramNodeKinds.Boundary, StringComparison.OrdinalIgnoreCase))
        {
            return GraphNodeTypes.TrustBoundary;
        }

        return GraphNodeTypes.TopologyResource;
    }
}
