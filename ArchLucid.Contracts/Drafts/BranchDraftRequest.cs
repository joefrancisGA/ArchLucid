namespace ArchLucid.Contracts.Drafts;

/// <summary>Body for cloning a parent draft with one invariant override (R12).</summary>
public sealed class BranchDraftRequest
{
    public DraftBranchOverrideKind OverrideKind
    {
        get;
        set;
    }

    /// <summary>Required when <see cref="OverrideKind" /> is <see cref="DraftBranchOverrideKind.QuestionAnswer" />.</summary>
    public string? OverrideKey
    {
        get;
        set;
    }

    public string OverrideValue
    {
        get;
        set;
    } = string.Empty;
}
