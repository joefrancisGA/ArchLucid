using ArchLucid.Core.Persistence.ApplicationPorts.Coordination;

namespace ArchLucid.Persistence.Coordination.Projection;

/// <summary>One row in <c>dbo.PostCommitProjectionOutbox</c> awaiting post-commit side-effect processing.</summary>
public sealed class PostCommitProjectionOutboxEntry : IRecoverableOutboxEntry
{
    public Guid OutboxId
    {
        get;
        init;
    }

    public string WorkType
    {
        get;
        init;
    } = null!;

    public Guid? RunId
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

    public string? PayloadJson
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public int AttemptCount
    {
        get;
        init;
    }

    public DateTime? LockedUntilUtc
    {
        get;
        init;
    }

    public DateTime? NextAttemptUtc
    {
        get;
        init;
    }

    public string? LastAttemptError
    {
        get;
        init;
    }

    public DateTime? DeadLetteredUtc
    {
        get;
        init;
    }
}
