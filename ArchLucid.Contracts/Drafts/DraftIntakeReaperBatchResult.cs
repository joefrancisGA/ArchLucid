using System.Text.Json.Serialization;

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

    // Scope is needed for cache eviction after the cross-tenant batch.
    [JsonIgnore]
    public IReadOnlyList<DraftIntakeReapedDraft> DeletedDrafts { get; init; } = [];
}

public sealed record DraftIntakeReapedDraft(Guid DraftId, Guid TenantId, Guid WorkspaceId, Guid ProjectId);
