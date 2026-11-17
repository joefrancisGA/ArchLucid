namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>
///     Copy for data-flow consumer status lines that count diagram neighbors on the current layout.
/// </summary>
internal static class DiagramForestDiagramNeighborOnViewCopy
{
    internal const string NoNeighborOnViewStatus = "No diagram neighbor on this view.";

    internal const string NoNeighborNotStoredConnectionClaim =
        "This is not a stored claim that the resource has no connections.";

    internal const string IsolationDisclaimer =
        "Diagram neighbors are adjacency on this layout, not network isolation.";

    internal static string FormatNoNeighborOnViewStatusLine() =>
        $"{NoNeighborOnViewStatus} {NoNeighborNotStoredConnectionClaim}";

    internal static string FormatNeighborCountStatus(int neighborCount) =>
        neighborCount == 0
            ? FormatNoNeighborOnViewStatusLine()
            : $"{neighborCount} diagram neighbors on this view. {IsolationDisclaimer}";

    internal static string FormatRollupMemberNeighborSummary(int withNeighborCount, int withoutNeighborCount) =>
        $"{withNeighborCount} with a diagram neighbor on this view · {withoutNeighborCount} with no diagram neighbor on this view";
}
