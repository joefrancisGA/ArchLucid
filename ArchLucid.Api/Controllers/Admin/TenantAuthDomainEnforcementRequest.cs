using ArchLucid.Core.Identity;

namespace ArchLucid.Api.Controllers.Admin;

public sealed class TenantAuthDomainEnforcementRequest
{
    public AuthDomainEnforcementMode EnforcementMode
    {
        get;
        init;
    }

    public bool AllowEmailOtpRecovery
    {
        get;
        init;
    }
}
