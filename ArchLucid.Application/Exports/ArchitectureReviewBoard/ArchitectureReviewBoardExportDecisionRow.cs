namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>Architecture decision captured during review workflow.</summary>
public sealed class ArchitectureReviewBoardExportDecisionRow
{
    public string Title
    {
        get;
        init;
    } = string.Empty;

    public string? Detail
    {
        get;
        init;
    }

    public string? RecordedAtUtcLabel
    {
        get;
        init;
    }
}
