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

            if (GraphNodePropertyReader.TryGetPropertyValue(
                    canonicalObject.Properties,
                    "extractionMethod",
                    out string? method)
                && !string.IsNullOrWhiteSpace(method))
            {
                extractionMethod = method.Trim();
            }

            string? subgraphId = ReadDiagramSubgraphId(canonicalObject);
            string? subgraphLabel = ReadDiagramSubgraphLabel(canonicalObject);

            if (!string.IsNullOrWhiteSpace(subgraphId))
            {
                if (!subgraphs.TryGetValue(subgraphId, out ArchitectureDiagramSubgraphRecord? subgraph))
                {
                    subgraphs[subgraphId] = new ArchitectureDiagramSubgraphRecord
                    {
                        Id = subgraphId,
                        Label = string.IsNullOrWhiteSpace(subgraphLabel) ? subgraphId : subgraphLabel,
                        OrderKey = subgraphOrder++,
                    };
                }
                else if (!string.IsNullOrWhiteSpace(subgraphLabel))
                {
                    subgraph.Label = subgraphLabel.Trim();
                }
            }

            ArchitectureDiagramNodeRecord incomingNode = new()
            {
                Id = diagramNodeId,
                Label = ReadLabel(canonicalObject),
                Kind = ReadDiagramNodeKind(canonicalObject),
                Provenance = ReadProvenance(canonicalObject),
                SubgraphId = subgraphId,
            };

            ArchitectureDiagramNodeRecord? existingNode = diagramNodes.FirstOrDefault(
                candidate => string.Equals(candidate.Id, diagramNodeId, StringComparison.OrdinalIgnoreCase));

            if (existingNode is null)
            {
                diagramNodes.Add(incomingNode);
                continue;
            }

            CoalesceDiagramNodeRecord(existingNode, incomingNode);
        }

        if (diagramNodes.Count == 0)
        {
            return null;
        }

        List<ArchitectureDiagramEdgeRecord> edges = ReconstructEdges(nodes, diagramNodeIdByObjectId);
        string? sourceEvidenceItemId = ResolveSourceEvidenceItemId(nodes, group.Key);

        return new StructuredDiagramReconstructedDocument
        {
            Model = new ArchitectureDiagramModelRecord
            {
                Nodes = diagramNodes,
                Edges = edges,
                Subgraphs = subgraphs.Values.OrderBy(subgraph => subgraph.OrderKey).ToList(),
                ExtractionMethod = extractionMethod,
                SourceEvidenceItemId = sourceEvidenceItemId,
            },
            LabelOnlyInferenceConfidence = ResolveLabelOnlyInferenceConfidence(nodes),
        };
    }

    private static string? ResolveSourceEvidenceItemId(IReadOnlyList<CanonicalObject> nodes, string documentSourceId)
    {
        foreach (CanonicalObject canonicalObject in nodes)
        {
            if (GraphNodePropertyReader.TryGetPropertyValue(
                    canonicalObject.Properties,
                    "sourceEvidenceItemId",
                    out string? raw)
                && !string.IsNullOrWhiteSpace(raw))
            {
                return raw.Trim();
            }
        }

        return string.IsNullOrWhiteSpace(documentSourceId) ? null : documentSourceId.Trim();
    }

    public static double ResolveLabelOnlyInferenceConfidence(IReadOnlyList<CanonicalObject> nodes)
    {
        double? labelOnlyConfidence = null;

        foreach (CanonicalObject canonicalObject in nodes)
        {
            if (!GraphNodePropertyReader.TryGetPropertyValue(
                    canonicalObject.Properties,
                    "inferenceConfidence",
                    out string? raw)
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

            if (!GraphNodePropertyReader.TryGetPropertyValue(
                    source.Properties,
                    "connectedToNodeIds",
                    out string? connectedRaw)
                || string.IsNullOrWhiteSpace(connectedRaw))
            {
                continue;
            }

            foreach (string targetToken in connectedRaw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                (string objectToken, string? edgeLabel, string? edgeProvenance, string? diagramEdgeId) =
                    ParseConnectedTargetToken(targetToken);
                string objectId = StripObjPrefix(objectToken);

                if (!diagramNodeIdByObjectId.TryGetValue(objectId, out string? targetDiagramNodeId))
                {
                    continue;
                }

                string resolvedEdgeId = !string.IsNullOrWhiteSpace(diagramEdgeId)
                    ? diagramEdgeId.Trim()
                    : $"edge-{edgeIndex++}";

                ArchitectureDiagramEdgeRecord incomingEdge = new()
                {
                    Id = resolvedEdgeId,
                    SourceId = sourceDiagramNodeId,
                    TargetId = targetDiagramNodeId,
                    Label = edgeLabel ?? string.Empty,
                    Provenance = edgeProvenance ?? ReadProvenance(source),
                };

                ArchitectureDiagramEdgeRecord? existingEdge = edges.FirstOrDefault(
                    candidate =>
                        string.Equals(candidate.Id, resolvedEdgeId, StringComparison.OrdinalIgnoreCase)
                        && string.Equals(candidate.SourceId, sourceDiagramNodeId, StringComparison.OrdinalIgnoreCase)
                        && string.Equals(candidate.TargetId, targetDiagramNodeId, StringComparison.OrdinalIgnoreCase));

                if (existingEdge is null)
                {
                    edges.Add(incomingEdge);
                    continue;
                }

                CoalesceDiagramEdgeRecord(existingEdge, incomingEdge);
            }
        }

        return edges;
    }

    private static void CoalesceDiagramEdgeRecord(
        ArchitectureDiagramEdgeRecord existing,
        ArchitectureDiagramEdgeRecord incoming)
    {
        if (!string.IsNullOrWhiteSpace(incoming.Label))
        {
            existing.Label = incoming.Label;
        }

        if (!string.IsNullOrWhiteSpace(incoming.Provenance))
        {
            existing.Provenance = incoming.Provenance;
        }
    }

    private static (string ObjectToken, string? EdgeLabel, string? EdgeProvenance, string? DiagramEdgeId)
        ParseConnectedTargetToken(string targetToken)
    {
        int firstSeparatorIndex = targetToken.IndexOf('|');

        if (firstSeparatorIndex < 0)
        {
            return (targetToken, null, null, null);
        }

        string objectToken = targetToken[..firstSeparatorIndex];
        int secondSeparatorIndex = targetToken.IndexOf('|', firstSeparatorIndex + 1);

        if (secondSeparatorIndex < 0)
        {
            string legacyEncodedLabel = targetToken[(firstSeparatorIndex + 1)..];

            if (string.IsNullOrWhiteSpace(legacyEncodedLabel))
            {
                return (objectToken, null, null, null);
            }

            return (objectToken, Uri.UnescapeDataString(legacyEncodedLabel), null, null);
        }

        string encodedLabel = targetToken[(firstSeparatorIndex + 1)..secondSeparatorIndex];
        string? edgeLabel = string.IsNullOrWhiteSpace(encodedLabel)
            ? null
            : Uri.UnescapeDataString(encodedLabel);

        int thirdSeparatorIndex = targetToken.IndexOf('|', secondSeparatorIndex + 1);

        if (thirdSeparatorIndex < 0)
        {
            string legacyProvenancePart = targetToken[(secondSeparatorIndex + 1)..];
            string? legacyEdgeProvenance = string.IsNullOrWhiteSpace(legacyProvenancePart)
                ? null
                : legacyProvenancePart.Trim();

            return (objectToken, edgeLabel, legacyEdgeProvenance, null);
        }

        string provenancePart = targetToken[(secondSeparatorIndex + 1)..thirdSeparatorIndex];
        string? edgeProvenance = string.IsNullOrWhiteSpace(provenancePart) ? null : provenancePart.Trim();

        string encodedEdgeId = targetToken[(thirdSeparatorIndex + 1)..];
        string? diagramEdgeId = string.IsNullOrWhiteSpace(encodedEdgeId)
            ? null
            : Uri.UnescapeDataString(encodedEdgeId);

        return (objectToken, edgeLabel, edgeProvenance, diagramEdgeId);
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

        if (!GraphNodePropertyReader.TryGetPropertyValue(
                canonicalObject.Properties,
                "diagramNodeId",
                out string? raw)
            || string.IsNullOrWhiteSpace(raw))
        {
            return false;
        }

        diagramNodeId = raw.Trim();
        return true;
    }

    private static void CoalesceDiagramNodeRecord(
        ArchitectureDiagramNodeRecord existing,
        ArchitectureDiagramNodeRecord incoming)
    {
        if (!string.IsNullOrWhiteSpace(incoming.Label))
        {
            existing.Label = incoming.Label;
        }

        if (!string.IsNullOrWhiteSpace(incoming.Kind))
        {
            existing.Kind = incoming.Kind;
        }

        if (!string.IsNullOrWhiteSpace(incoming.Provenance))
        {
            existing.Provenance = incoming.Provenance;
        }

        if (!string.IsNullOrWhiteSpace(incoming.SubgraphId))
        {
            existing.SubgraphId = incoming.SubgraphId;
        }
    }

    private static string ReadLabel(CanonicalObject canonicalObject)
    {
        if (GraphNodePropertyReader.TryGetPropertyValue(
                canonicalObject.Properties,
                "text",
                out string? text)
            && !string.IsNullOrWhiteSpace(text))
        {
            return text.Trim();
        }

        return canonicalObject.Name.Trim();
    }

    private static string? ReadDiagramSubgraphId(CanonicalObject canonicalObject)
    {
        if (!GraphNodePropertyReader.TryGetPropertyValue(
                canonicalObject.Properties,
                "diagramSubgraphId",
                out string? raw)
            || string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        return raw.Trim();
    }

    private static string? ReadDiagramSubgraphLabel(CanonicalObject canonicalObject)
    {
        if (!GraphNodePropertyReader.TryGetPropertyValue(
                canonicalObject.Properties,
                "diagramSubgraphLabel",
                out string? raw)
            || string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        return raw.Trim();
    }

    private static string ReadDiagramNodeKind(CanonicalObject canonicalObject)
    {
        if (GraphNodePropertyReader.TryGetPropertyValue(
                canonicalObject.Properties,
                "diagramNodeKind",
                out string? kind)
            && !string.IsNullOrWhiteSpace(kind))
        {
            return kind.Trim();
        }

        return ArchitectureDiagramNodeKinds.System;
    }

    private static string ReadProvenance(CanonicalObject canonicalObject)
    {
        if (GraphNodePropertyReader.TryGetPropertyValue(
                canonicalObject.Properties,
                "inferenceConfidence",
                out string? confidence)
            && confidence is not null
            && string.Equals(confidence.Trim(), "1", StringComparison.Ordinal))
        {
            return ArchitectureDiagramProvenanceKinds.Asserted;
        }

        return ArchitectureDiagramProvenanceKinds.Inferred;
    }
}
