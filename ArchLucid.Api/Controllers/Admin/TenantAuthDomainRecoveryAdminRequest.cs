namespace ArchLucid.Api.Controllers.Admin;

public sealed class TenantAuthDomainRecoveryAdminRequest
{
    public string Email
    {
        get;
        init;
    } = string.Empty;
}
