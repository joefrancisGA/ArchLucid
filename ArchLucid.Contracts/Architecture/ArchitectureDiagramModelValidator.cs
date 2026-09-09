namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Validates structured diagram models used as review input (AS-006).
/// </summary>
public static class ArchitectureDiagramModelValidator
{
    public static bool TryValidate(
        ArchitectureDiagramModelRecord? model,
        out string? failureReason)
    {
        if (model is null)
        {
            failureReason = "Structured diagram model deserialized to null.";
            return false;
        }

        HashSet<string> subgraphIds = new(StringComparer.Ordinal);

        foreach (ArchitectureDiagramSubgraphRecord subgraph in model.Subgraphs)
        {
            if (!ArchitectureDiagramModelIdRules.IsValidStableId(subgraph.Id))
            {
                failureReason = $"Structured diagram subgraph id '{subgraph.Id}' is invalid.";
                return false;
            }

            if (!subgraphIds.Add(subgraph.Id.Trim()))
            {
                failureReason = $"Structured diagram subgraph id '{subgraph.Id}' is duplicated.";
                return false;
            }
        }

        foreach (ArchitectureDiagramSubgraphRecord subgraph in model.Subgraphs)
        {
            if (!string.IsNullOrWhiteSpace(subgraph.ParentSubgraphId)
                && !subgraphIds.Contains(subgraph.ParentSubgraphId.Trim()))
            {
                failureReason = $"Structured diagram subgraph '{subgraph.Id}' references unknown parent '{subgraph.ParentSubgraphId}'.";
                return false;
            }
        }

        HashSet<string> nodeIds = new(StringComparer.Ordinal);

        foreach (ArchitectureDiagramNodeRecord node in model.Nodes)
        {
            if (!ArchitectureDiagramModelIdRules.IsValidStableId(node.Id))
            {
                failureReason = $"Structured diagram node id '{node.Id}' is invalid.";
                return false;
            }

            if (!nodeIds.Add(node.Id.Trim()))
            {
                failureReason = $"Structured diagram node id '{node.Id}' is duplicated.";
                return false;
            }

            if (!string.IsNullOrWhiteSpace(node.SubgraphId)
                && !subgraphIds.Contains(node.SubgraphId.Trim()))
            {
                failureReason = $"Structured diagram node '{node.Id}' references unknown subgraph '{node.SubgraphId}'.";
                return false;
            }
        }

        foreach (ArchitectureDiagramEdgeRecord edge in model.Edges)
        {
            if (!ArchitectureDiagramModelIdRules.IsValidStableId(edge.Id))
            {
                failureReason = $"Structured diagram edge id '{edge.Id}' is invalid.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(edge.SourceId) || string.IsNullOrWhiteSpace(edge.TargetId))
            {
                failureReason = "Structured diagram edges require sourceId and targetId.";
                return false;
            }

            if (!nodeIds.Contains(edge.SourceId.Trim()) || !nodeIds.Contains(edge.TargetId.Trim()))
            {
                failureReason = "Structured diagram edge references an unknown node id.";
                return false;
            }
        }

        failureReason = null;
        return true;
    }
}
