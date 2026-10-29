namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Reviewer-facing graph node labels for finding titles — never substitute raw node ids for missing labels.
/// </summary>
internal static class GraphNodeReviewerLabel
{
    public const string NotStoredCopy = "Graph node label was not stored.";

    public static string ForFindingTitle(string? label) =>
        ForFindingTitle(label, nodeId: null);

    public static string ForFindingTitle(string? label, string? nodeId)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            return NotStoredCopy;
        }

        string trimmed = label.Trim();

        if (!string.IsNullOrWhiteSpace(nodeId)
            && string.Equals(trimmed, nodeId.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            return NotStoredCopy;
        }

        if (trimmed.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase)
            || trimmed.Contains("/providers/", StringComparison.OrdinalIgnoreCase))
        {
            return NotStoredCopy;
        }

        return trimmed;
    }
}
