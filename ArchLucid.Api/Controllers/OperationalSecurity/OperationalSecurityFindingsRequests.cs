using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Api.Controllers.OperationalSecurity;

public sealed class OperationalSecurityFindingIngestRequestItem
{
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

    public DateTime? ObservedUtc
    {
        get;
        init;
    }

    public OperationalSecurityFindingStatus Status
    {
        get;
        init;
    } = OperationalSecurityFindingStatus.Open;

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

    public Dictionary<string, string?> Metadata
    {
        get;
        init;
    } = new(StringComparer.Ordinal);
}

public sealed class OperationalSecurityFindingIngestRequest
{
    public List<OperationalSecurityFindingIngestRequestItem> Items
    {
        get;
        init;
    } = [];
}
