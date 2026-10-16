using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Drafts;

/// <summary>Outcome of one terminal-draft hard-delete batch (ADR 0048 reaper).</summary>
public sealed class DraftIntakeReaperBatchResult
{
    private IReadOnlyList<Guid> deletedDraftIds = [];

    public IReadOnlyList<Guid> DeletedDraftIds
    {
        get => deletedDraftIds;
        init => deletedDraftIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
