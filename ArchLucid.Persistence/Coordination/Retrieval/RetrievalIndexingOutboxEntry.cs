namespace ArchLucid.Persistence.Coordination.Retrieval;

/// <summary>
///     One row in <c>dbo.RetrievalIndexingOutbox</c> (or in-memory equivalent) awaiting retrieval indexing.
/// </summary>
public sealed class RetrievalIndexingOutboxEntry
{
    public Guid OutboxId
    {
        get;
        init;
    }

    public Guid RunId
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

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    /// <summary>Claim / retry bookkeeping stored on <c>dbo.RetrievalIndexingOutbox</c>.</summary>
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
