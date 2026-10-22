using ArchLucid.Contracts.Architecture;

namespace ArchLucid.ContextIngestion.Diagram;

public static class VisionDiagramModelValidator
{
    public static bool TryValidate(
        ArchitectureDiagramModelRecord? model,
        out string? failureReason)
    {
        if (model is null)
        {
            failureReason = "Vision diagram model deserialized to null.";
            return false;
        }

        HashSet<string> nodeIds = new(StringComparer.Ordinal);

        foreach (ArchitectureDiagramNodeRecord node in model.Nodes)
        {
            if (string.IsNullOrWhiteSpace(node.Id))
            {
                failureReason = "Vision diagram node id is required.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(node.Label))
            {
                failureReason = $"Vision diagram node '{node.Id}' requires a label.";
                return false;
            }

            if (!nodeIds.Add(node.Id))
            {
                failureReason = $"Vision diagram node id '{node.Id}' is duplicated.";
                return false;
            }
        }

        foreach (ArchitectureDiagramEdgeRecord edge in model.Edges)
        {
            if (string.IsNullOrWhiteSpace(edge.SourceId) || string.IsNullOrWhiteSpace(edge.TargetId))
            {
                failureReason = "Vision diagram edges require sourceId and targetId.";
                return false;
            }

            if (!nodeIds.Contains(edge.SourceId) || !nodeIds.Contains(edge.TargetId))
            {
                failureReason = "Vision diagram edge references an unknown node id.";
                return false;
            }
        }

        failureReason = null;
        return true;
    }
}
