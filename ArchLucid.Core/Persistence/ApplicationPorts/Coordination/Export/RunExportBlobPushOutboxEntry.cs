using ArchLucid.Core.Persistence.ApplicationPorts.Coordination;

namespace ArchLucid.Persistence.Coordination.Export;

/// <summary>
///     One row in <c>dbo.RunExportBlobPushOutbox</c> (or in-memory equivalent) awaiting blob upload.
/// </summary>
public sealed class RunExportBlobPushOutboxEntry : IRecoverableOutboxEntry
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

    public string DestinationSasUrl
    {
        get;
        init;
    } = null!;

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    /// <summary>Claim / retry bookkeeping stored on <c>dbo.RunExportBlobPushOutbox</c>.</summary>
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
