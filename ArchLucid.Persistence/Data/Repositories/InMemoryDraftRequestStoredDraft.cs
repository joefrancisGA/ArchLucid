using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Persistence.Data.Repositories;

internal sealed class InMemoryDraftRequestStoredDraft
{
    public Guid DraftId
    {
        get;
        set;
    }

    public Guid TenantId
    {
        get;
        set;
    }

    public Guid WorkspaceId
    {
        get;
        set;
    }

    public Guid ProjectId
    {
        get;
        set;
    }

    public string CreatedByUserId
    {
        get;
        set;
    } = string.Empty;

    public Guid? ArchitectureId
    {
        get;
        set;
    }

    public DraftRequestStatus Status
    {
        get;
        set;
    }

    public DraftRequestDocument Document
    {
        get;
        set;
    } = new();

    public string? RedirectReason
    {
        get;
        set;
    }

    public string? SpawnedRunId
    {
        get;
        set;
    }

    public Guid? SpawnedArchitectureVersionId
    {
        get;
        set;
    }

    public byte[]? DocumentContentHashSha256
    {
        get;
        set;
    }

    public byte[]? SpawnedDocumentContentHashSha256
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public DateTime UpdatedUtc
    {
        get;
        set;
    }
}
