namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>Risk row (typically derived from findings at or above the export threshold).</summary>
public sealed class ArchitectureReviewBoardExportRiskRow
{
    public string SeverityLabel
    {
        get;
        init;
    } = string.Empty;

    public string Summary
    {
        get;
        init;
    } = string.Empty;

    public string? Detail
    {
        get;
        init;
    }
}
