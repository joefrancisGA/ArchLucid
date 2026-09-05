using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class RemediationInstanceRecord
{
    public Guid InstanceId
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

    public Guid FindingId
    {
        get;
        init;
    }

    public Guid PatternId
    {
        get;
        init;
    }

    public Guid PatternVersionId
    {
        get;
        init;
    }

    public string PatternKey
    {
        get;
        init;
    } = string.Empty;

    public string FrozenPatternVersion
    {
        get;
        init;
    } = string.Empty;

    public RemediationAutomationLevel AutomationLevel
    {
        get;
        init;
    }

    public RemediationInstanceStatus Status
    {
        get;
        init;
    }

    public Guid? CloudResourceId
    {
        get;
        init;
    }

    public Guid? AssessmentId
    {
        get;
        init;
    }

    public Guid? ControlId
    {
        get;
        init;
    }

    public Guid? PreflightSnapshotId
    {
        get;
        init;
    }

    public Guid? ExecutionSnapshotId
    {
        get;
        init;
    }

    public Guid? VerificationSnapshotId
    {
        get;
        init;
    }

    public Guid? WaveId
    {
        get;
        init;
    }

    public string? PreflightResultJson
    {
        get;
        init;
    }

    public string? VerificationResultJson
    {
        get;
        init;
    }

    public string CreatedByActorKey
    {
        get;
        init;
    } = string.Empty;

    public string? ApprovedByActorKey
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

    public DateTime? ApprovedUtc
    {
        get;
        init;
    }

    public DateTime? ExecutedUtc
    {
        get;
        init;
    }

    public DateTime? VerifiedUtc
    {
        get;
        init;
    }

    public DateTime? ClosedUtc
    {
        get;
        init;
    }
}
