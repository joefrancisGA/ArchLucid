using ArchLucid.Core.Identity;

namespace ArchLucid.Api.Controllers.Admin;

public sealed class TenantAuthDomainAdminResponse
{
    public TenantSignInEmailDomainRecord Domain
    {
        get;
        init;
    } = null!;

    public string DnsVerificationInstruction
    {
        get;
        init;
    } = string.Empty;
}
