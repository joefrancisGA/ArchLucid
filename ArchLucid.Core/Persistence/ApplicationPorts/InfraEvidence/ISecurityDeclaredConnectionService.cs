using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityDeclaredConnectionService
{
    Task<SecurityDeclaredConnectionCreateResult> CreateAsync(
        ScopeContext scope,
        SecurityDeclaredConnectionCreateRequest request,
        CancellationToken cancellationToken = default);

    Task<SecurityDeclaredConnectionRenewResult> RenewAsync(
        ScopeContext scope,
        Guid connectionId,
        SecurityDeclaredConnectionRenewRequest request,
        CancellationToken cancellationToken = default);

    Task<SecurityDeclaredConnectionRevokeResult> RevokeAsync(
        ScopeContext scope,
        Guid connectionId,
        string revokedByActorKey,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> ListAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);

    Task<SecurityDeclaredConnectionExpirySweepResult> SweepExpiredAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);
}

public sealed class SecurityDeclaredConnectionCreateRequest
{
    public Guid FromCloudResourceId
    {
        get;
        init;
    }

    public Guid ToCloudResourceId
    {
        get;
        init;
    }

    public SecurityDeclaredConnectionRelationshipType RelationshipType
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

public sealed class SecurityDeclaredConnectionRenewRequest
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

public sealed class SecurityDeclaredConnectionCreateResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public Guid? ConnectionId
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

public sealed class SecurityDeclaredConnectionRenewResult
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

public sealed class SecurityDeclaredConnectionRevokeResult
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

public sealed class SecurityDeclaredConnectionExpirySweepResult
{
    public int ExpiredCount
    {
        get;
        init;
    }
}
