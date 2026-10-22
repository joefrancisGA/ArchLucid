namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>Traceability key/value line for the appendix.</summary>
public sealed class ArchitectureReviewBoardExportTraceRow
{
    public string Label
    {
        get;
        init;
    } = string.Empty;

    public string Value
    {
        get;
        init;
    } = string.Empty;
}
