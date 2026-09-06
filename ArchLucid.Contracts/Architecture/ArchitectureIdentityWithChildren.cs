namespace ArchLucid.Contracts.Architecture;

/// <summary>Architecture identity with child summaries for the Monday desk.</summary>
public sealed class ArchitectureIdentityWithChildren
{
    public ArchitectureIdentityRecord Identity
    {
        get;
        set;
    } = new();

    public ArchitectureIdentityCurrentDraftSummary? CurrentDraft
    {
        get;
        set;
    }

    public IReadOnlyList<ArchitectureIdentityReviewChildSummary> Reviews
    {
        get;
        set;
    } = Array.Empty<ArchitectureIdentityReviewChildSummary>();
}
