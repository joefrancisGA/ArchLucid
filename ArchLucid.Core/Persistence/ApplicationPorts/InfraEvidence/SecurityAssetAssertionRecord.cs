using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SecurityAssetAssertionRecord
{
    public Guid AssertionId
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

    public Guid CloudResourceId
    {
        get;
        init;
    }

    public SecurityAssetDataSensitivity DataSensitivity
    {
        get;
        init;
    }

    public SecurityAssetRegulatoryClass RegulatoryClass
    {
        get;
        init;
    }

    public SecurityAssetDeploymentEnvironment DeploymentEnvironment
    {
        get;
        init;
    }

    public SecurityAssetBusinessCriticality BusinessCriticality
    {
        get;
        init;
    }

    public bool IsRevenueImpact
    {
        get;
        init;
    }

    public bool IsPatientImpact
    {
        get;
        init;
    }

    public string Rationale
    {
        get;
        init;
    } = string.Empty;

    public string? EvidenceReference
    {
        get;
        init;
    }

    public DateTime ExpirationUtc
    {
        get;
        init;
    }

    public SecurityAssetAssertionStatus Status
    {
        get;
        init;
    }

    public string RequestedByActorKey
    {
        get;
        init;
    } = string.Empty;

    public string ApprovedByActorKey
    {
        get;
        init;
    } = string.Empty;

    public byte[] PayloadHashSha256
    {
        get;
        init;
    } = [];

    public DateTime? ExpiryProcessedUtc
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

    public DateTime? RevokedUtc
    {
        get;
        init;
    }

    public string? RevokedByActorKey
    {
        get;
        init;
    }

    public bool QualifiesAsCrownJewel() =>
        BusinessCriticality == SecurityAssetBusinessCriticality.CrownJewel
        || DataSensitivity == SecurityAssetDataSensitivity.Phi
        || IsPatientImpact;
}
