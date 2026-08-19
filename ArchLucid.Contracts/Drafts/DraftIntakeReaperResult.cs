namespace ArchLucid.Contracts.Drafts;

/// <summary>Aggregate outcome of a draft intake reaper pass.</summary>
public sealed class DraftIntakeReaperResult
{
    public int DraftsDeleted
    {
        get;
        init;
    }
}
