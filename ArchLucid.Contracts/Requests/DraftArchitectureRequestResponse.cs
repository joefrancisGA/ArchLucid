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
}
