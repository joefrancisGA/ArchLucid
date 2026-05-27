namespace ArchLucid.Contracts.Exports;

/// <summary>One manifest decision line for sponsor-facing executive review packets.</summary>
public sealed class ExecutiveReviewPacketDecisionRow
{
    public string Title
    {
        get;
        set;
    } = string.Empty;

    public string SelectedOption
    {
        get;
        set;
    } = string.Empty;

    public string? ConfidenceLabel
    {
        get;
        set;
    }

    public string EvidenceHref
    {
        get;
        set;
    } = string.Empty;
}
