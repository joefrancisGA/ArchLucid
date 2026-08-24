namespace ArchLucid.Contracts.Requests;

public sealed class DraftArchitectureRequestResponse
{
    public string[] SuggestedConstraints
    {
        get;
        set;
    } = [];

    public string[] SuggestedCapabilities
    {
        get;
        set;
    } = [];

    public string[] SuggestedAssumptions
    {
        get;
        set;
    } = [];

    public string[] TopologyHints
    {
        get;
        set;
    } = [];

    public string[] SecurityBaselineHints
    {
        get;
        set;
    } = [];

    /// <summary>
    /// One concise failure-mode and recovery note for structured-brief operations fields (optional).
    /// </summary>
    public string? SuggestedFailureModeNote
    {
        get;
        set;
    }

    /// <summary>
    ///     Confirmed assumptions that explicit overview evidence contradicts (empty when none or check skipped).
    /// </summary>
    public List<EvidenceContradictedBriefAssumption> EvidenceContradictedAssumptions
    {
        get;
        set;
    } = [];
}
