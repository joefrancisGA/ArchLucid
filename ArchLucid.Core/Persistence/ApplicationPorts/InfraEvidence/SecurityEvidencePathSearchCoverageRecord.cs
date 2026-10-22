using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SecurityEvidencePathSearchCoverageRecord
{
    public Guid SearchCoverageId
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

    public string EngineName
    {
        get;
        init;
    } = string.Empty;

    public SecurityEvidencePathSearchLimitKind LimitKind
    {
        get;
        init;
    }

    public int LimitValue
    {
        get;
        init;
    }

    public int PathsEmitted
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }
}
