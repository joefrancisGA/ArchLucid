using ArchLucid.Contracts.Operations;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Tenant-scoped row in <c>dbo.AdvisoryDraftOperations</c> (DR-14).</summary>
public sealed class AdvisoryDraftOperationRow
{
    public required Guid TenantId
    {
        get;
        init;
    }

    public required Guid WorkspaceId
    {
        get;
        init;
    }

    public required Guid ProjectId
    {
        get;
        init;
    }

    public required Guid OperationId
    {
        get;
        init;
    }

    public OperationState State
    {
        get;
        set;
    }

    public string StepLabel
    {
        get;
        set;
    } = string.Empty;

    public int CurrentStep
    {
        get;
        set;
    }

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }

    public DateTimeOffset HeartbeatUtc
    {
        get;
        set;
    }

    public DateTimeOffset? CompletedUtc
    {
        get;
        set;
    }

    public string? ResultJson
    {
        get;
        set;
    }

    public string? ErrorMessage
    {
        get;
        set;
    }
}
