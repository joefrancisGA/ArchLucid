using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Context;

namespace ArchLucid.KnowledgeGraph.Diagram;

/// <summary>
///     Rebuilds <see cref="ArchitectureDiagramModelRecord" /> rows from structured-diagram
///     <see cref="CanonicalObject" /> groups produced by context-ingestion parsers (AS-016).
/// </summary>
public static class StructuredDiagramCanonicalModelReconstructor
{
    public static IReadOnlyList<StructuredDiagramReconstructedDocument> ReconstructDocuments(
        IReadOnlyList<CanonicalObject> canonicalObjects)
    {
        ArgumentNullException.ThrowIfNull(canonicalObjects);

        IEnumerable<IGrouping<string, CanonicalObject>> diagramGroups = canonicalObjects
            .Where(IsStructuredDiagramCanonicalObject)
            .GroupBy(obj => obj.SourceId.Trim(), StringComparer.Ordinal);

        List<StructuredDiagramReconstructedDocument> documents = [];

        foreach (IGrouping<string, CanonicalObject> group in diagramGroups)
        {
            StructuredDiagramReconstructedDocument? document = ReconstructSingleDocument(group);

            if (document is not null)
            {
                documents.Add(document);
            }
        }

        return documents;
    }

    private static bool IsStructuredDiagramCanonicalObject(CanonicalObject canonicalObject)
    {
        return string.Equals(
            canonicalObject.SourceType,
            StructuredDiagramCanonicalSourceTypes.StructuredDiagram,
            StringComparison.OrdinalIgnoreCase);
    }

    private static StructuredDiagramReconstructedDocument? ReconstructSingleDocument(
        IGrouping<string, CanonicalObject> group)
    {
        List<CanonicalObject> nodes = group.ToList();

        if (nodes.Count == 0)
        {
            return null;
        }

        Dictionary<string, string> diagramNodeIdByObjectId = new(StringComparer.Ordinal);
        List<ArchitectureDiagramNodeRecord> diagramNodes = [];
        Dictionary<string, ArchitectureDiagramSubgraphRecord> subgraphs = new(StringComparer.Ordinal);
        string extractionMethod = DiagramExtractionMethods.StructuredParse;
        int subgraphOrder = 0;

        foreach (CanonicalObject canonicalObject in nodes)
        {
            if (!TryReadDiagramNodeId(canonicalObject, out string diagramNodeId))
            {
                continue;
            }

            diagramNodeIdByObjectId[canonicalObject.ObjectId.Trim()] = diagramNodeId;

            if (canonicalObject.Properties.TryGetValue("extractionMethod", out string? method)
                && !string.IsNullOrWhiteSpace(method))
            {
                extractionMethod = method.Trim();
            }

            string? subgraphId = ReadDiagramSubgraphId(canonicalObject);
            string? subgraphLabel = ReadDiagramSubgraphLabel(canonicalObject);

            if (!string.IsNullOrWhiteSpace(subgraphId)
                && !subgraphs.ContainsKey(subgraphId))
            {
                subgraphs[subgraphId] = new ArchitectureDiagramSubgraphRecord
                {
                    Id = subgraphId,
                    Label = string.IsNullOrWhiteSpace(subgraphLabel) ? subgraphId : subgraphLabel,
                    OrderKey = subgraphOrder++,
                };
            }

            diagramNodes.Add(new ArchitectureDiagramNodeRecord
            {
                Id = diagramNodeId,
                Label = ReadLabel(canonicalObject),
                Kind = ReadDiagramNodeKind(canonicalObject),
                Provenance = ReadProvenance(canonicalObject),
                SubgraphId = subgraphId,
            });
        }

        if (diagramNodes.Count == 0)
        {
            return null;
        }

        List<ArchitectureDiagramEdgeRecord> edges = ReconstructEdges(nodes, diagramNodeIdByObjectId);

        return new StructuredDiagramReconstructedDocument
        {
            Model = new ArchitectureDiagramModelRecord
            {
                Nodes = diagramNodes,
                Edges = edges,
                Subgraphs = subgraphs.Values.OrderBy(subgraph => subgraph.OrderKey).ToList(),
                ExtractionMethod = extractionMethod,
            },
            LabelOnlyInferenceConfidence = ResolveLabelOnlyInferenceConfidence(nodes),
        };
    }

    public static double ResolveLabelOnlyInferenceConfidence(IReadOnlyList<CanonicalObject> nodes)
    {
        double? labelOnlyConfidence = null;

        foreach (CanonicalObject canonicalObject in nodes)
        {
            if (!canonicalObject.Properties.TryGetValue("inferenceConfidence", out string? raw)
                || string.IsNullOrWhiteSpace(raw)
                || !double.TryParse(raw.Trim(), out double confidence))
            {
                continue;
            }

            if (confidence >= 1d)
            {
                continue;
            }

            labelOnlyConfidence = labelOnlyConfidence.HasValue
                ? Math.Min(labelOnlyConfidence.Value, confidence)
                : confidence;
        }

        return labelOnlyConfidence ?? StructuredDiagramLabelOnlyInferenceDefaults.StandardConfidence;
    }

    private static List<ArchitectureDiagramEdgeRecord> ReconstructEdges(
        IReadOnlyList<CanonicalObject> nodes,
        Dictionary<string, string> diagramNodeIdByObjectId)
    {
        List<ArchitectureDiagramEdgeRecord> edges = [];
        int edgeIndex = 0;

        foreach (CanonicalObject source in nodes)
        {
            if (!TryReadDiagramNodeId(source, out string sourceDiagramNodeId))
            {
                continue;
            }

            if (!source.Properties.TryGetValue("connectedToNodeIds", out string? connectedRaw)
                || string.IsNullOrWhiteSpace(connectedRaw))
            {
                continue;
            }

            foreach (string targetToken in connectedRaw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                string objectId = StripObjPrefix(targetToken);

                if (!diagramNodeIdByObjectId.TryGetValue(objectId, out string? targetDiagramNodeId))
                {
                    continue;
                }

                edges.Add(new ArchitectureDiagramEdgeRecord
                {
                    Id = $"edge-{edgeIndex++}",
                    SourceId = sourceDiagramNodeId,
                    TargetId = targetDiagramNodeId,
                    Provenance = ReadProvenance(source),
                });
            }
        }

        return edges;
    }

    private static string StripObjPrefix(string graphNodeOrObjectToken)
    {
        const string prefix = "obj-";

        if (graphNodeOrObjectToken.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            return graphNodeOrObjectToken[prefix.Length..];
        }

        return graphNodeOrObjectToken;
    }

    private static bool TryReadDiagramNodeId(CanonicalObject canonicalObject, out string diagramNodeId)
    {
        diagramNodeId = string.Empty;

        if (!canonicalObject.Properties.TryGetValue("diagramNodeId", out string? raw)
            || string.IsNullOrWhiteSpace(raw))
        {
            return false;
        }

        diagramNodeId = raw.Trim();
        return true;
    }

    private static string ReadLabel(CanonicalObject canonicalObject)
    {
        if (canonicalObject.Properties.TryGetValue("text", out string? text)
            && !string.IsNullOrWhiteSpace(text))
        {
            return text.Trim();
        }

        return canonicalObject.Name.Trim();
    }

    private static string? ReadDiagramSubgraphId(CanonicalObject canonicalObject)
    {
        if (!canonicalObject.Properties.TryGetValue("diagramSubgraphId", out string? raw)
            || string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        return raw.Trim();
    }

    private static string? ReadDiagramSubgraphLabel(CanonicalObject canonicalObject)
    {
        if (!canonicalObject.Properties.TryGetValue("diagramSubgraphLabel", out string? raw)
            || string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        return raw.Trim();
    }

    private static string ReadDiagramNodeKind(CanonicalObject canonicalObject)
    {
        if (canonicalObject.Properties.TryGetValue("diagramNodeKind", out string? kind)
            && !string.IsNullOrWhiteSpace(kind))
        {
            return kind.Trim();
        }

        return ArchitectureDiagramNodeKinds.System;
    }

    private static string ReadProvenance(CanonicalObject canonicalObject)
    {
        if (canonicalObject.Properties.TryGetValue("inferenceConfidence", out string? confidence)
            && string.Equals(confidence.Trim(), "1", StringComparison.Ordinal))
        {
            return ArchitectureDiagramProvenanceKinds.Asserted;
        }

        return ArchitectureDiagramProvenanceKinds.Inferred;
    }
}
