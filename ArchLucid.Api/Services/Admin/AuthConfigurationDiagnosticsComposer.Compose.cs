using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Identity;

namespace ArchLucid.Api.Services.Admin;

public static partial class AuthConfigurationDiagnosticsComposer
{
    public static AdminAuthConfigurationDiagnosticsResponse Compose(
        AdminOidcDiagnosticsResponse oidc,
        AdminSamlOperationalHealthResponse saml,
        ArchLucidSamlAuthOptions samlOptions,
        TenantIdentityProviderConfigurationRecord? tenantIdentityProvider,
        AuthConfigurationScimDiagnostics? scimDiagnostics = null,
        bool operatorBaseUrlConfigured = true,
        bool localTrialIdentityConfigured = true)
    {
        ArgumentNullException.ThrowIfNull(oidc);
        ArgumentNullException.ThrowIfNull(saml);
        ArgumentNullException.ThrowIfNull(samlOptions);

        bool audienceConfigured = IsAudienceConfigured(oidc);
        bool issuerOrAuthorityConfigured = IsIssuerOrAuthorityConfigured(oidc, samlOptions);
        bool? spEntityIdConfigured = saml.Saml2Enabled ? IsSpEntityIdConfigured(samlOptions) : null;
        bool? samlRoleSourcesConfigured = saml.Saml2Enabled ? HasSamlRoleClaimSources(samlOptions) : null;
        (bool? tenantMappingConfigured, string? protocol) = EvaluateTenantClaimMapping(tenantIdentityProvider);
        bool? jwksConfigured = EvaluateJwksConfigured(oidc);
        bool? roleClaimNameConfigured = EvaluateRoleClaimNameConfigured(
            saml.Saml2Enabled,
            samlRoleSourcesConfigured,
            tenantMappingConfigured,
            tenantIdentityProvider);

        List<string> hints = BuildHints(
            oidc,
            saml,
            samlOptions,
            audienceConfigured,
            issuerOrAuthorityConfigured,
            spEntityIdConfigured,
            samlRoleSourcesConfigured,
            tenantMappingConfigured,
            tenantIdentityProvider,
            jwksConfigured,
            roleClaimNameConfigured,
            scimDiagnostics);

        hints = AppendBetaReadinessHints(hints, operatorBaseUrlConfigured, localTrialIdentityConfigured);

        return new AdminAuthConfigurationDiagnosticsResponse
        {
            AuthMode = oidc.AuthMode,
            AudienceConfigured = audienceConfigured,
            IssuerOrAuthorityConfigured = issuerOrAuthorityConfigured,
            OpenIdDiscoverySucceeded = oidc.DiscoveryAttempted ? oidc.DiscoverySucceeded : null,
            Saml2Enabled = saml.Saml2Enabled,
            SpEntityIdConfigured = spEntityIdConfigured,
            SamlRoleClaimSourcesConfigured = samlRoleSourcesConfigured,
            TenantClaimMappingConfigured = tenantMappingConfigured,
            TenantIdentityProviderProtocol = protocol,
            JwksConfigured = jwksConfigured,
            ScimProvisioningConfigured = scimDiagnostics?.ScimProvisioningConfigured,
            ScimBearerTokenActive = scimDiagnostics?.ScimBearerTokenActive,
            RoleClaimNameConfigured = roleClaimNameConfigured,
            MisconfigurationHints = hints,
            OperatorBaseUrlConfigured = operatorBaseUrlConfigured,
            LocalTrialIdentityConfigured = localTrialIdentityConfigured,
        };
    }

    /// <summary>
    ///     True when enterprise JWT/SAML configuration has blocking misconfiguration hints (safe for CLI exit codes).
    /// </summary>
    public static bool HasBlockingMisconfiguration(AdminAuthConfigurationDiagnosticsResponse response)
    {
        ArgumentNullException.ThrowIfNull(response);

        if (string.Equals(response.AuthMode, "DevelopmentBypass", StringComparison.OrdinalIgnoreCase))
            return true;

        if (string.Equals(response.AuthMode, "ApiKey", StringComparison.OrdinalIgnoreCase))
            return false;

        if (!response.AudienceConfigured)
            return true;

        if (!response.IssuerOrAuthorityConfigured)
            return true;

        if (response.OpenIdDiscoverySucceeded == false)
            return true;

        if (response.JwksConfigured == false)
            return true;

        if (response.Saml2Enabled && response.SpEntityIdConfigured == false)
            return true;

        if (response.Saml2Enabled && response.SamlRoleClaimSourcesConfigured == false)
            return true;

        if (response.TenantClaimMappingConfigured == false)
            return true;

        if (!response.OperatorBaseUrlConfigured)
            return true;

        if (!response.LocalTrialIdentityConfigured)
            return true;

        return false;
    }
}
