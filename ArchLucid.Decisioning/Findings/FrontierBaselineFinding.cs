namespace ArchLucid.Decisioning.Findings;

/// <summary>Hand-authored or captured baseline finding used for frontier-delta novelty measurement.</summary>
public sealed class FrontierBaselineFinding
{
    public string Category
    {
        get;
        init;
    } = null!;

    public string Title
    {
        get;
        init;
    } = null!;

    public string? RuleId
    {
        get;
        init;
    }
}
