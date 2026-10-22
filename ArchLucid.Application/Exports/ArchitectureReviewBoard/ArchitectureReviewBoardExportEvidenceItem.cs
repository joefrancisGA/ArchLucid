namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>Single evidence item attached to the finalized architecture review.</summary>
public sealed class ArchitectureReviewBoardExportEvidenceItem
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

    public string? Reference
    {
        get;
        init;
    }
}
