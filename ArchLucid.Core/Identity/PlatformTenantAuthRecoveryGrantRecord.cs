namespace ArchLucid.Core.Identity;

public sealed class PlatformTenantAuthRecoveryGrantRecord
{
    public Guid GrantId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public string NormalizedDomain
    {
        get;
        init;
    } = string.Empty;

    public string Reason
    {
        get;
        init;
    } = string.Empty;

    public string EvidenceReference
    {
        get;
        init;
    } = string.Empty;

    public string GrantedByActorId
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset GrantedUtc
    {
        get;
        init;
    }

    public DateTimeOffset ExpiresUtc
    {
        get;
        init;
    }

    public DateTimeOffset? RevokedUtc
    {
        get;
        init;
    }

    public string? RevokedByActorId
    {
        get;
        init;
    }

    public DateTimeOffset? TenantNotifiedUtc
    {
        get;
        init;
    }

    public bool IsActive(DateTimeOffset nowUtc) =>
        RevokedUtc is null && ExpiresUtc > nowUtc;
}
