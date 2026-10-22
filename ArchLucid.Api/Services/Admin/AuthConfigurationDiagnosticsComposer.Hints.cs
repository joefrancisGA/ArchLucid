using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Core.Identity;

namespace ArchLucid.Api.Services.Admin;

public static partial class AuthConfigurationDiagnosticsComposer
{
    private static List<string> BuildHints(
        AdminOidcDiagnosticsResponse oidc,
        AdminSamlOperationalHealthResponse saml,
        ArchLucidSamlAuthOptions samlOptions,
        bool audienceConfigured,
        bool issuerOrAuthorityConfigured,
        bool? spEntityIdConfigured,
        bool? samlRoleSourcesConfigured,
        bool? tenantClaimMappingConfigured,
        TenantIdentityProviderConfigurationRecord? tenantIdentityProvider,
        bool? jwksConfigured,
        bool? roleClaimNameConfigured,
        AuthConfigurationScimDiagnostics? scimDiagnostics)
    {
        List<string> hints = [];

        if (string.Equals(oidc.AuthMode, "DevelopmentBypass", StringComparison.OrdinalIgnoreCase))
        {
            hints.Add(
                "ArchLucidAuth:Mode is DevelopmentBypass — acceptable for local pilots only; use JwtBearer or ApiKey in shared environments.");

            return hints;
        }

        if (string.Equals(oidc.AuthMode, "ApiKey", StringComparison.OrdinalIgnoreCase))
        {
            hints.Add(
                "ArchLucidAuth:Mode is ApiKey — OIDC discovery checks are informational; configure JwtBearer before enterprise SSO.");

            return hints;
        }

        if (string.Equals(oidc.AuthMode, "JwtBearer", StringComparison.OrdinalIgnoreCase))
        {
            AppendJwtBearerHints(
                hints,
                oidc,
                audienceConfigured,
                issuerOrAuthorityConfigured,
                tenantClaimMappingConfigured,
                tenantIdentityProvider,
                jwksConfigured,
                roleClaimNameConfigured);
        }

        if (saml.Saml2Enabled)
            AppendSamlHints(hints, saml, samlOptions, spEntityIdConfigured, samlRoleSourcesConfigured);

        AppendScimHints(hints, scimDiagnostics);

        return hints;
    }

    private static void AppendJwtBearerHints(
        List<string> hints,
        AdminOidcDiagnosticsResponse oidc,
        bool audienceConfigured,
        bool issuerOrAuthorityConfigured,
        bool? tenantClaimMappingConfigured,
        TenantIdentityProviderConfigurationRecord? tenantIdentityProvider,
        bool? jwksConfigured,
        bool? roleClaimNameConfigured)
    {
        if (!oidc.UsesLocalJwtSigningKey && !issuerOrAuthorityConfigured)
        {
            hints.Add(
                "Set ArchLucidAuth:Authority to your IdP issuer root URL (must be absolute HTTPS) so OpenID discovery can load JWKS.");
        }

        if (!audienceConfigured)
        {
            hints.Add(
                "Set ArchLucidAuth:Audience to the API identifier expected in token aud claims (Entra app ID URI or resource identifier).");
        }

        if (oidc.UsesLocalJwtSigningKey)
        {
            if (string.IsNullOrWhiteSpace(oidc.LocalJwtIssuer))
                hints.Add("Local JWT signing is enabled but ArchLucidAuth:JwtLocalIssuer is empty.");

            if (string.IsNullOrWhiteSpace(oidc.LocalJwtAudience))
                hints.Add("Local JWT signing is enabled but ArchLucidAuth:JwtLocalAudience is empty.");

            return;
        }

        if (oidc.DiscoveryAttempted && oidc.DiscoverySucceeded == false)
        {
            string detail = oidc.DiscoveryError ?? oidc.DiagnosticSummary ?? "OpenID discovery failed.";

            hints.Add($"OIDC metadata is unreachable or invalid: {detail}");
        }

        if (jwksConfigured == false)
        {
            hints.Add(
                "OpenID discovery succeeded but jwks_uri is missing — verify IdP metadata exposes a JWKS endpoint for token signature validation.");
        }

        if (roleClaimNameConfigured == false && tenantIdentityProvider is null)
        {
            hints.Add(
                "Configure ArchLucidAuth:Saml2:RoleClaimSources or tenant SSO RoleClaimName mapping so ArchLucid roles can be resolved after sign-in.");
        }

        if (tenantIdentityProvider is not null && tenantClaimMappingConfigured == false)
        {
            hints.Add(
                "Tenant SSO wizard row exists but ClaimMappingJson is missing RoleClaimName or IdP→ArchLucid role mappings — complete activation in Settings → Identity providers.");
        }
        else if (tenantIdentityProvider is null && oidc.DiscoverySucceeded == true)
        {
            hints.Add(
                "Host JwtBearer discovery succeeded; map IdP group/role claims via the tenant SSO wizard when users receive 403 after sign-in.");
        }
    }

    private static void AppendSamlHints(
        List<string> hints,
        AdminSamlOperationalHealthResponse saml,
        ArchLucidSamlAuthOptions samlOptions,
        bool? spEntityIdConfigured,
        bool? samlRoleSourcesConfigured)
    {
        if (spEntityIdConfigured == false)
        {
            hints.Add(
                "Set ArchLucidAuth:Saml2:Issuer to the SAML SP entity ID (absolute URI) registered with your IdP.");
        }

        if (samlRoleSourcesConfigured == false)
        {
            hints.Add(
                "Configure ArchLucidAuth:Saml2:RoleClaimSources with SAML attribute claim types that carry group or role values.");
        }

        if (!string.IsNullOrWhiteSpace(saml.SpSigningCertificateDiagnosticSummary))
            hints.Add(saml.SpSigningCertificateDiagnosticSummary);

        if (!string.IsNullOrWhiteSpace(saml.IdpMetadataDiagnosticSummary))
            hints.Add($"IdP metadata: {saml.IdpMetadataDiagnosticSummary}");

        if (string.IsNullOrWhiteSpace(samlOptions.IdPMetadata?.Trim()))
            hints.Add("Set ArchLucidAuth:Saml2:IdPMetadata to the HTTPS federation metadata URL for your IdP.");
    }

    private static void AppendScimHints(List<string> hints, AuthConfigurationScimDiagnostics? scimDiagnostics)
    {
        if (scimDiagnostics?.ScimProvisioningConfigured != true)
            return;

        if (scimDiagnostics.ScimBearerTokenActive == false)
        {
            hints.Add(
                "SCIM provisioning is configured but no active bearer token was found — issue or rotate a token under Settings → SCIM (see docs/integrations/SCIM_PROVISIONING.md).");
        }
    }

    private static List<string> AppendBetaReadinessHints(
        List<string> hints,
        bool operatorBaseUrlConfigured,
        bool localTrialIdentityConfigured)
    {
        if (!operatorBaseUrlConfigured)
        {
            hints.Add(
                "Email:OperatorBaseUrl is not set — user invitations cannot include a clickable accept link. "
                + "Set it to your operator UI origin (for example https://app.example.com) before sending invites.");
        }

        if (!localTrialIdentityConfigured)
        {
            hints.Add(
                "Auth:Trial:LocalIdentity is incomplete — invite accept cannot mint API sessions. "
                + "Configure JwtIssuer, JwtAudience, and JwtPrivateKeyPemPath (file must exist on the API host).");
        }

        return hints;
    }
}
