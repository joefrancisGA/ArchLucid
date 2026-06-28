namespace ArchLucid.Contracts.Advisory.Workflow;

/// <summary>Navigable evidence anchor persisted on <see cref="RecommendationRecord" />.</summary>
public sealed class RecommendationSourceEvidenceLink
{
    public string Kind
    {
        get;
        set;
    } = null!;

    public string Id
    {
        get;
        set;
    } = null!;
}
