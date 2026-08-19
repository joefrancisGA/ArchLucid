namespace ArchLucid.Contracts.Drafts;

/// <summary>Outcome of one terminal-draft hard-delete batch (ADR 0048 reaper).</summary>
public sealed class DraftIntakeReaperBatchResult
{
    public IReadOnlyList<Guid> DeletedDraftIds
    {
        get;
        init;
    } = [];
}
