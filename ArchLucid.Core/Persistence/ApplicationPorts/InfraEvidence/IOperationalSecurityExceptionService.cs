using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IOperationalSecurityExceptionService
{
    Task<OperationalSecurityExceptionCreateResult> CreateAsync(
        ScopeContext scope,
        OperationalSecurityExceptionCreateRequest request,
        CancellationToken cancellationToken = default);

    Task<OperationalSecurityExceptionRevokeResult> RevokeAsync(
        ScopeContext scope,
        Guid exceptionId,
        string revokedByActorKey,
        CancellationToken cancellationToken = default);

    Task<OperationalSecurityExceptionExpirySweepResult> SweepExpiredAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);
}

public sealed class OperationalSecurityExceptionCreateRequest
{
    public Guid? FindingId
    {
        get;
        init;
    }

    public Guid? PatternId
    {
        get;
        init;
    }

    public Guid? CloudResourceId
    {
        get;
        init;
    }

    public IReadOnlyList<string> OwnerActorKeys
    {
        get;
        init;
    } = [];

    public string Rationale
    {
        get;
        init;
    } = string.Empty;

    public string? ResidualRisk
    {
        get;
        init;
    }

    public string? CompensatingControls
    {
        get;
        init;
    }

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

public sealed class OperationalSecurityExceptionCreateResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public Guid? ExceptionId
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

public sealed class OperationalSecurityExceptionRevokeResult
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

public sealed class OperationalSecurityExceptionExpirySweepResult
{
    public int ExpiredCount
    {
        get;
        init;
    }

    public int FindingsReopenedCount
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
