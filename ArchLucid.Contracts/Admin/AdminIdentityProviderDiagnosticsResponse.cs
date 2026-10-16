namespace ArchLucid.Contracts.Admin;

/// <summary>Unified OIDC and SAML health snapshot for operator diagnostics.</summary>
public sealed class AdminIdentityProviderDiagnosticsResponse
{
    private AdminIdentityProviderHealthProbe oidc = new();

    public AdminIdentityProviderHealthProbe Oidc
    {
        get => oidc;
        init => oidc = value ?? new();
    }

    private AdminIdentityProviderHealthProbe saml = new();

    public AdminIdentityProviderHealthProbe Saml
    {
        get => saml;
        init => saml = value ?? new();
    }
}
