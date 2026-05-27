namespace ArchLucid.Contracts.Governance;

/// <summary>One durable manifest decision in the decision register (TB-060).</summary>
public sealed class ArchitectureDecisionRegisterEntry
{
    public string DecisionId
    {
        get;
        init;
    } = string.Empty;

    public Guid ManifestId
    {
        get;
        init;
    }

    public Guid RunId
    {
        get;
        init;
    }

    public string Category
    {
        get;
        init;
    } = string.Empty;

    public string Title
    {
        get;
        init;
    } = string.Empty;

    public string SelectedOption
    {
        get;
        init;
    } = string.Empty;

    public string Rationale
    {
        get;
        init;
    } = string.Empty;

    public double? Confidence
    {
        get;
        init;
    }

    public string? ConfidenceSource
    {
        get;
        init;
    }

    public DateTimeOffset RecordedAtUtc
    {
        get;
        init;
    }

    public IReadOnlyList<string> SupportingFindingIds
    {
        get;
        init;
    } = [];
}
