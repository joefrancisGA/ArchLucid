using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Core.Findings;

/// <summary>
///     Package-scoped diagram shape and edge ids for <see cref="DiagramEvidenceCitationRefs" /> resolution (AS-022).
/// </summary>
public sealed class DiagramPackageCitationIndex
{
    private readonly HashSet<string> _shapeAndEdgeIds;
    private readonly Dictionary<string, HashSet<string>> _shapeIdsByEvidenceItemId;

    private DiagramPackageCitationIndex(
        HashSet<string> shapeAndEdgeIds,
        Dictionary<string, HashSet<string>> shapeIdsByEvidenceItemId)
    {
        _shapeAndEdgeIds = shapeAndEdgeIds;
        _shapeIdsByEvidenceItemId = shapeIdsByEvidenceItemId;
    }

    public bool Contains(string? evidenceItemId, string shapeOrEdgeId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(shapeOrEdgeId);

        string shapeId = shapeOrEdgeId.Trim();

        if (!_shapeAndEdgeIds.Contains(shapeId))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(evidenceItemId))
        {
            return true;
        }

        string evidenceId = evidenceItemId.Trim();

        return _shapeIdsByEvidenceItemId.TryGetValue(evidenceId, out HashSet<string>? scopedShapeIds)
            && scopedShapeIds.Contains(shapeId);
    }

    public static DiagramPackageCitationIndex FromModels(IEnumerable<ArchitectureDiagramModelRecord> models)
    {
        ArgumentNullException.ThrowIfNull(models);

        HashSet<string> shapeAndEdgeIds = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, HashSet<string>> shapeIdsByEvidenceItemId = new(StringComparer.OrdinalIgnoreCase);

        foreach (ArchitectureDiagramModelRecord model in models)
        {
            if (model is null)
            {
                continue;
            }

            string? evidenceItemId = string.IsNullOrWhiteSpace(model.SourceEvidenceItemId)
                ? null
                : model.SourceEvidenceItemId.Trim();

            foreach (ArchitectureDiagramNodeRecord node in model.Nodes)
            {
                if (node.Removed || string.IsNullOrWhiteSpace(node.Id))
                {
                    continue;
                }

                string nodeId = node.Id.Trim();
                shapeAndEdgeIds.Add(nodeId);
                AddScopedShape(shapeIdsByEvidenceItemId, evidenceItemId, nodeId);
            }

            foreach (ArchitectureDiagramEdgeRecord edge in model.Edges)
            {
                if (edge.Removed || string.IsNullOrWhiteSpace(edge.Id))
                {
                    continue;
                }

                string edgeId = edge.Id.Trim();
                shapeAndEdgeIds.Add(edgeId);
                AddScopedShape(shapeIdsByEvidenceItemId, evidenceItemId, edgeId);
            }
        }

        return new DiagramPackageCitationIndex(shapeAndEdgeIds, shapeIdsByEvidenceItemId);
    }

    private static void AddScopedShape(
        Dictionary<string, HashSet<string>> shapeIdsByEvidenceItemId,
        string? evidenceItemId,
        string shapeOrEdgeId)
    {
        if (string.IsNullOrWhiteSpace(evidenceItemId))
        {
            return;
        }

        if (!shapeIdsByEvidenceItemId.TryGetValue(evidenceItemId, out HashSet<string>? scopedShapeIds))
        {
            scopedShapeIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            shapeIdsByEvidenceItemId[evidenceItemId] = scopedShapeIds;
        }

        scopedShapeIds.Add(shapeOrEdgeId);
    }
}
