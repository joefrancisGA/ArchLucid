namespace ArchLucid.Contracts.Requests;

/// <summary>
/// Plain-English rationale for one structured-brief suggestion (on-demand, not part of bulk suggest).
/// </summary>
public sealed class ExplainStructuredBriefSuggestionResponse
{
    /// <summary>Audience-facing explanation (roughly 80–120 words).</summary>
    public string Explanation
    {
        get;
        set;
    } = string.Empty;
}
