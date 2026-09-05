using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class OperationalSecurityFindingRecord
{
    public Guid FindingId
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

    public CloudProvider Provider
    {
        get;
        init;
    }

    public string SourceSystem
    {
        get;
        init;
    } = string.Empty;

    public string SourceFindingId
    {
        get;
        init;
    } = string.Empty;

    public Guid? CloudResourceId
    {
        get;
        init;
    }

    public string? ExternalResourceId
    {
        get;
        init;
    }

    public string? ResourceType
    {
        get;
        init;
    }

    public string? SubscriptionOrAccountId
    {
        get;
        init;
    }

    public string? ControlId
    {
        get;
        init;
    }

    public string? ControlFramework
    {
        get;
        init;
    }

    public string Title
    {
        get;
        init;
    } = string.Empty;

    public string? Description
    {
        get;
        init;
    }

    public string? Severity
    {
        get;
        init;
    }

    public decimal? RiskScore
    {
        get;
        init;
    }

    public string? Exploitability
    {
        get;
        init;
    }

    public string? Exposure
    {
        get;
        init;
    }

    public string? BusinessCriticality
    {
        get;
        init;
    }

    public string? BlastRadius
    {
        get;
        init;
    }

    public DateTime FirstObservedUtc
    {
        get;
        init;
    }

    public DateTime LastObservedUtc
    {
        get;
        init;
    }

    public OperationalSecurityFindingStatus Status
    {
        get;
        init;
    }

    public string? RawEvidenceReference
    {
        get;
        init;
    }

    public Guid? AssessmentId
    {
        get;
        init;
    }

    public Guid? InventoryDiffId
    {
        get;
        init;
    }

    public Guid? AuditEvidenceSnapshotId
    {
        get;
        init;
    }

    public byte[] PayloadHashSha256
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
