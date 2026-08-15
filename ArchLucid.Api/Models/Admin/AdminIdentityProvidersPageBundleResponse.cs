using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Contracts.Admin;

namespace ArchLucid.Api.Models.Admin;

/// <summary>Identity providers settings hub: unified probes plus configuration diagnostics (single OIDC/SAML build).</summary>
public sealed class AdminIdentityProvidersPageBundleResponse
{
    public AdminIdentityProviderDiagnosticsResponse IdentityProviderDiagnostics
    {
        get;
        init;
    } = new();

    public AdminAuthConfigurationDiagnosticsResponse AuthConfigurationDiagnostics
    {
        get;
        init;
    } = new();

    public AdminOidcDiagnosticsResponse OidcDiagnostics
    {
        get;
        init;
    } = new();

    public AdminSamlOperationalHealthResponse SamlOperationalHealth
    {
        get;
        init;
    } = new();
}
