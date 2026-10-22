namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>Outcome row from policy pack evaluation against the architecture snapshot.</summary>
public sealed class ArchitectureReviewBoardExportPolicyFindingRow
{
    public string PolicyPackNameOrId
    {
        get;
        init;
    } = string.Empty;

    public string Outcome
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
