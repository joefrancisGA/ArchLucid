namespace ArchLucid.Contracts.Drafts;

/// <summary>API representation of a persisted draft request.</summary>
public sealed class DraftRequestResponse
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

    /// <summary>Populated when <see cref="Status" /> is <see cref="DraftRequestStatus.Redirected" />.</summary>
    public string? RedirectReason
    {
        get;
        set;
    }

    /// <summary>Populated when <see cref="Status" /> is <see cref="DraftRequestStatus.RunSpawned" />.</summary>
    public string? SpawnedRunId
    {
        get;
        set;
    }

    /// <summary>Immutable architecture revision pinned when the draft spawned its review run.</summary>
    public Guid? SpawnedArchitectureVersionId
    {
        get;
        set;
    }

    /// <summary>SHA-256 of canonical draft document JSON (current revision).</summary>
    public byte[]? DocumentContentHashSha256
    {
        get;
        set;
    }

    /// <summary>Document hash pinned when the draft transitioned to <see cref="DraftRequestStatus.RunSpawned" />.</summary>
    public byte[]? SpawnedDocumentContentHashSha256
    {
        get;
        set;
    }

    /// <summary>Canonical actor key or mailbox captured when the draft was created.</summary>
    public string CreatedByUserId
    {
        get;
        set;
    } = string.Empty;

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
