using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>
///     Persisted operator inferred connection proposal or confirmation (SN-RT-10).
/// </summary>
public sealed class OperatorInferredConnectionRecord
{
    public Guid ConnectionId
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

    public Guid SnapshotId
    {
        get;
        init;
    }

    public OperatorInferredConnectionStatus Status
    {
        get;
        init;
    }

    public OperatorInferredConnectionSource Source
    {
        get;
        init;
    }

    public string? RuleName
    {
        get;
        init;
    }

    public string? QuestionText
    {
        get;
        init;
    }

    public string? FromArmId
    {
        get;
        init;
    }

    public string? FromLabel
    {
        get;
        init;
    }

    public Guid? FromCloudResourceId
    {
        get;
        init;
    }

    public string? ToHost
    {
        get;
        init;
    }

    public string? ToCatalog
    {
        get;
        init;
    }

    public string? ToArmId
    {
        get;
        init;
    }

    public Guid? ToCloudResourceId
    {
        get;
        init;
    }

    public string? SettingName
    {
        get;
        init;
    }

    public string? SourceFileFormat
    {
        get;
        init;
    }

    public string? ActorKey
    {
        get;
        init;
    }

    public byte[] ProposalPayloadHashSha256
    {
        get;
        init;
    } = [];

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
