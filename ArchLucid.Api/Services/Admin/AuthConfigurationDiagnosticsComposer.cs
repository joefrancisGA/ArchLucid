using System.Text.Json;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Identity;

namespace ArchLucid.Api.Services.Admin;

/// <summary>Maps host OIDC/SAML diagnostics and optional tenant SSO rows into buyer-safe configuration hints.</summary>
public static class AuthConfigurationDiagnosticsComposer
{
    private static readonly JsonSerializerOptions ClaimMappingJsonOptions = new(JsonSerializerDefaults.Web);

    public static AdminAuthConfigurationDiagnosticsResponse Compose(
        AdminOidcDiagnosticsResponse oidc,
        AdminSamlOperationalHealthResponse saml,
        ArchLucidSamlAuthOptions samlOptions,
        TenantIdentityProviderConfigurationRecord? tenantIdentityProvider)
    {
        ArgumentNullException.ThrowIfNull(oidc);
        ArgumentNullException.ThrowIfNull(saml);
        ArgumentNullException.ThrowIfNull(samlOptions);

        bool audienceConfigured = IsAudienceConfigured(oidc);
        bool issuerOrAuthorityConfigured = IsIssuerOrAuthorityConfigured(oidc, samlOptions);
        bool? spEntityIdConfigured = saml.Saml2Enabled ? IsSpEntityIdConfigured(samlOptions) : null;
        bool? samlRoleSourcesConfigured = saml.Saml2Enabled ? HasSamlRoleClaimSources(samlOptions) : null;
        (bool? tenantMappingConfigured, string? protocol) = EvaluateTenantClaimMapping(tenantIdentityProvider);

        List<string> hints = BuildHints(
            oidc,
            saml,
            samlOptions,
            audienceConfigured,
            issuerOrAuthorityConfigured,
            spEntityIdConfigured,
            samlRoleSourcesConfigured,
            tenantMappingConfigured,
            tenantIdentityProvider);

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
            MisconfigurationHints = hints,
        };
    }

    private static bool IsAudienceConfigured(AdminOidcDiagnosticsResponse oidc)
    {
        if (!string.IsNullOrWhiteSpace(oidc.ConfiguredAudience))
            return true;

        if (oidc.UsesLocalJwtSigningKey && !string.IsNullOrWhiteSpace(oidc.LocalJwtAudience))
            return true;

        return false;
    }

    private static bool IsIssuerOrAuthorityConfigured(
        AdminOidcDiagnosticsResponse oidc,
        ArchLucidSamlAuthOptions samlOptions)
    {
        if (!string.IsNullOrWhiteSpace(oidc.ConfiguredAuthority))
            return true;

        if (oidc.UsesLocalJwtSigningKey && !string.IsNullOrWhiteSpace(oidc.LocalJwtIssuer))
            return true;

        if (samlOptions.Enabled && IsSpEntityIdConfigured(samlOptions) == true)
            return true;

        return false;
    }

    private static bool IsSpEntityIdConfigured(ArchLucidSamlAuthOptions samlOptions)
    {
        string issuer = samlOptions.Issuer?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(issuer))
            return false;

        return Uri.TryCreate(issuer, UriKind.Absolute, out _);
    }

    private static bool HasSamlRoleClaimSources(ArchLucidSamlAuthOptions samlOptions)
    {
        string[] sources = samlOptions.RoleClaimSources ?? [];

        return sources.Any(static s => !string.IsNullOrWhiteSpace(s));
    }

    private static (bool? Configured, string? Protocol) EvaluateTenantClaimMapping(
        TenantIdentityProviderConfigurationRecord? tenantIdentityProvider)
    {
        if (tenantIdentityProvider is null)
            return (null, null);

        string protocol = tenantIdentityProvider.Protocol.ToString();

        if (string.IsNullOrWhiteSpace(tenantIdentityProvider.ClaimMappingJson))
            return (false, protocol);

        try
        {
            IdentityClaimRoleMappingDocument? mapping =
                JsonSerializer.Deserialize<IdentityClaimRoleMappingDocument>(
                    tenantIdentityProvider.ClaimMappingJson,
                    ClaimMappingJsonOptions);

            if (mapping is null)
                return (false, protocol);

            bool roleClaimPresent = !string.IsNullOrWhiteSpace(mapping.RoleClaimName);
            bool hasEntries = mapping.Mappings.Count > 0;

            return (roleClaimPresent && hasEntries, protocol);
        }
        catch (JsonException)
        {
            return (false, protocol);
        }
    }

    private static List<string> BuildHints(
        AdminOidcDiagnosticsResponse oidc,
        AdminSamlOperationalHealthResponse saml,
        ArchLucidSamlAuthOptions samlOptions,
        bool audienceConfigured,
        bool issuerOrAuthorityConfigured,
        bool? spEntityIdConfigured,
        bool? samlRoleSourcesConfigured,
        bool? tenantClaimMappingConfigured,
        TenantIdentityProviderConfigurationRecord? tenantIdentityProvider)
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
                tenantIdentityProvider);
        }

        if (saml.Saml2Enabled)
            AppendSamlHints(hints, saml, samlOptions, spEntityIdConfigured, samlRoleSourcesConfigured);

        return hints;
    }

    private static void AppendJwtBearerHints(
        List<string> hints,
        AdminOidcDiagnosticsResponse oidc,
        bool audienceConfigured,
        bool issuerOrAuthorityConfigured,
        bool? tenantClaimMappingConfigured,
        TenantIdentityProviderConfigurationRecord? tenantIdentityProvider)
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
}
