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
