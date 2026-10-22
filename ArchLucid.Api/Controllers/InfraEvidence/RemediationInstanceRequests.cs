namespace ArchLucid.Api.Controllers.InfraEvidence;

public sealed class RemediationInstanceCreateRequest
{
    public Guid FindingId
    {
        get;
        set;
    }
}

public sealed class RemediationInstancePreflightRequest
{
    public Guid InventorySnapshotId
    {
        get;
        set;
    }
}

public sealed class RemediationInstanceAssignWaveRequest
{
    public Guid WaveId
    {
        get;
        set;
    }
}

public sealed class RemediationInstanceExecuteRequest
{
    public Guid InventorySnapshotId
    {
        get;
        set;
    }

    public string? CorrelationId
    {
        get;
        set;
    }
}

public sealed class RemediationInstanceVerifyRequest
{
    public Guid VerificationSnapshotId
    {
        get;
        set;
    }
}
