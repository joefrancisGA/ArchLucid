namespace ArchLucid.Contracts.Admin;

/// <summary>Unified OIDC and SAML health snapshot for operator diagnostics.</summary>
public sealed class AdminIdentityProviderDiagnosticsResponse
{
    public AdminIdentityProviderHealthProbe Oidc
    {
        get;
        init;
    } = new();

    public AdminIdentityProviderHealthProbe Saml
    {
        get;
        init;
    } = new();
}
