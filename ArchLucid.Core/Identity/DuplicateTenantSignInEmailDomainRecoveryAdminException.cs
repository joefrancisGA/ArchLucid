namespace ArchLucid.Core.Identity;

public sealed class DuplicateTenantSignInEmailDomainRecoveryAdminException : Exception
{
    public DuplicateTenantSignInEmailDomainRecoveryAdminException(
        Guid tenantId,
        string normalizedDomain,
        string normalizedRecoveryAdminEmail)
        : base(
            $"Recovery admin '{normalizedRecoveryAdminEmail}' for domain '{normalizedDomain}' on tenant '{tenantId:D}' already exists.")
    {
        TenantId = tenantId;
        NormalizedDomain = normalizedDomain;
        NormalizedRecoveryAdminEmail = normalizedRecoveryAdminEmail;
    }

    public Guid TenantId
    {
        get;
    }

    public string NormalizedDomain
    {
        get;
    }

    public string NormalizedRecoveryAdminEmail
    {
        get;
    }
}
