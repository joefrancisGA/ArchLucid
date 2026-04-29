namespace ArchLucid.Persistence.Models;

public sealed class FindingReviewEventRecord
{
    public Guid EventId
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

    public string FindingId
    {
        get;
        set;
    } = null!;

    public string ReviewerUserId
    {
        get;
        set;
    } = null!;

    public string Action
    {
        get;
        set;
    } = null!;

    public string? Notes
    {
        get;
        set;
    }

    public DateTime OccurredAtUtc
    {
        get;
        set;
    }

    public Guid? RunId
    {
        get;
        set;
    }
}
