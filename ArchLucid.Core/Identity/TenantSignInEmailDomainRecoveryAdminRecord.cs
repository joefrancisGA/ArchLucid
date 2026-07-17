namespace ArchLucid.Core.Identity;

public sealed class TenantSignInEmailDomainRecoveryAdminRecord
{
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

    public string NormalizedRecoveryAdminEmail
    {
        get;
        init;
    } = string.Empty;

    public string DisplayRecoveryAdminEmail
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }

    public string CreatedByActorId
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset? AuthenticationVerifiedUtc
    {
        get;
        init;
    }
}
