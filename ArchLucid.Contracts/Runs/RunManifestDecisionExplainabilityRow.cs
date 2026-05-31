namespace ArchLucid.Contracts.Runs;

/// <summary>Manifest decision row on unified run decision explainability (TB-054).</summary>
public sealed class RunManifestDecisionExplainabilityRow
{
    public string Pipeline
    {
        get;
        set;
    } = "authority";

    public string DecisionId
    {
        get;
        set;
    } = string.Empty;

    public string Category
    {
        get;
        set;
    } = string.Empty;

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

    public string Rationale
    {
        get;
        set;
    } = string.Empty;

    public double? Confidence
    {
        get;
        set;
    }

    public string? ConfidenceSource
    {
        get;
        set;
    }

    public string? BuyerConfidenceSource
    {
        get;
        set;
    }

    public IReadOnlyList<string> SupportingFindingIds
    {
        get;
        set;
    } = [];
}
