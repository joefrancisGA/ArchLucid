namespace ArchLucid.Api.Controllers.Admin;

public sealed class TenantAuthDomainProposeRequest
{
    public string Domain
    {
        get;
        init;
    } = string.Empty;
}
