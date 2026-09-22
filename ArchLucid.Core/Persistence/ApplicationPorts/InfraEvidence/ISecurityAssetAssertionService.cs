using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityAssetAssertionService
{
    Task<SecurityAssetAssertionCreateResult> CreateAsync(
        ScopeContext scope,
        SecurityAssetAssertionCreateRequest request,
        CancellationToken cancellationToken = default);

    Task<SecurityAssetAssertionRenewResult> RenewAsync(
        ScopeContext scope,
        Guid assertionId,
        SecurityAssetAssertionRenewRequest request,
        CancellationToken cancellationToken = default);

    Task<SecurityAssetAssertionRevokeResult> RevokeAsync(
        ScopeContext scope,
        Guid assertionId,
        string revokedByActorKey,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityAssetAssertionRecord>> ListAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);

    Task<SecurityAssetAssertionExpirySweepResult> SweepExpiredAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);
}

public sealed class SecurityAssetAssertionCreateRequest
{
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
}

public sealed class SecurityAssetAssertionRenewRequest
{
    public DateTime ExpirationUtc
    {
        get;
        init;
    }

    public string RenewedByActorKey
    {
        get;
        init;
    } = string.Empty;

    public string ApprovedByActorKey
    {
        get;
        init;
    } = string.Empty;
}

public sealed class SecurityAssetAssertionCreateResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public Guid? AssertionId
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }
}

public sealed class SecurityAssetAssertionRenewResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }
}

public sealed class SecurityAssetAssertionRevokeResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }
}

public sealed class SecurityAssetAssertionExpirySweepResult
{
    public int ExpiredCount
    {
        get;
        init;
    }

    public int ObservationsCreatedCount
    {
        get;
        init;
    }
}
