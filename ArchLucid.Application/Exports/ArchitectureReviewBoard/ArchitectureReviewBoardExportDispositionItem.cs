namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>Finding framed as requiring operator disposition (not autonomous authority).</summary>
public sealed class ArchitectureReviewBoardExportDispositionItem
{
    public string Summary
    {
        get;
        init;
    } = string.Empty;

    public string? Context
    {
        get;
        init;
    }
}
