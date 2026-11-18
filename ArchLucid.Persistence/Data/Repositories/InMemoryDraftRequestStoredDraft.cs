using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Persistence.Data.Repositories;

internal sealed record InMemoryDraftRequestStoredDraft
{
    public Guid DraftId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }

    public Guid ProjectId
    {
        get;
        init;
    }

    public string CreatedByUserId
    {
        get;
        init;
    } = string.Empty;

    public Guid? ArchitectureId
    {
        get;
        init;
    }

    public DraftRequestStatus Status
    {
        get;
        init;
    }

    public DraftRequestDocument Document
    {
        get;
        init;
    } = new();

    public string? RedirectReason
    {
        get;
        init;
    }

    public string? SpawnedRunId
    {
        get;
        init;
    }

    public Guid? SpawnedArchitectureVersionId
    {
        get;
        init;
    }

    public byte[]? DocumentContentHashSha256
    {
        get;
        init;
    }

    public byte[]? SpawnedDocumentContentHashSha256
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public DateTime UpdatedUtc
    {
        get;
        init;
    }
}
