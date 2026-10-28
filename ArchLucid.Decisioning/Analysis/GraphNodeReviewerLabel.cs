namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Reviewer-facing graph node labels for finding titles — never substitute raw node ids for missing labels.
/// </summary>
internal static class GraphNodeReviewerLabel
{
    public const string NotStoredCopy = "Graph node label was not stored.";

    public static string ForFindingTitle(string? label) =>
        string.IsNullOrWhiteSpace(label) ? NotStoredCopy : label.Trim();
}
