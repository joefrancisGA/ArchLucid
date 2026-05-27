using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Identity;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Admin;

[Trait("Suite", "Core")]
public sealed class AuthConfigurationDiagnosticsComposerTests
{
    [Fact]
    public void Compose_JwtBearer_missing_authority_and_audience_emits_hints()
    {
        AdminOidcDiagnosticsResponse oidc = new()
        {
            AuthMode = "JwtBearer",
            DiscoveryAttempted = false,
            DiscoverySucceeded = false,
            DiscoveryError = "ArchLucidAuth:Authority is empty; cannot resolve OpenID Connect metadata.",
        };

        AdminAuthConfigurationDiagnosticsResponse response = AuthConfigurationDiagnosticsComposer.Compose(
            oidc,
            new AdminSamlOperationalHealthResponse { Saml2Enabled = false },
            new ArchLucidSamlAuthOptions(),
            tenantIdentityProvider: null);

        response.AudienceConfigured.Should().BeFalse();
        response.IssuerOrAuthorityConfigured.Should().BeFalse();
        response.MisconfigurationHints.Should().Contain(h => h.Contains("Authority", StringComparison.Ordinal));
        response.MisconfigurationHints.Should().Contain(h => h.Contains("Audience", StringComparison.Ordinal));
    }

    [Fact]
    public void Compose_JwtBearer_discovery_failure_surfaces_transport_error()
    {
        AdminOidcDiagnosticsResponse oidc = new()
        {
            AuthMode = "JwtBearer",
            ConfiguredAuthority = "https://idp.example/",
            ConfiguredAudience = "api://archlucid",
            DiscoveryAttempted = true,
            DiscoverySucceeded = false,
            DiscoveryError = "HTTP 404 when fetching OpenID configuration.",
        };

        AdminAuthConfigurationDiagnosticsResponse response = AuthConfigurationDiagnosticsComposer.Compose(
            oidc,
            new AdminSamlOperationalHealthResponse { Saml2Enabled = false },
            new ArchLucidSamlAuthOptions(),
            tenantIdentityProvider: null);

        response.OpenIdDiscoverySucceeded.Should().BeFalse();
        response.MisconfigurationHints.Should().Contain(h => h.Contains("404", StringComparison.Ordinal));
    }

    [Fact]
    public void Compose_Saml_enabled_without_issuer_or_role_sources_emits_hints()
    {
        AdminOidcDiagnosticsResponse oidc = new() { AuthMode = "JwtBearer", ConfiguredAudience = "api" };

        AdminAuthConfigurationDiagnosticsResponse response = AuthConfigurationDiagnosticsComposer.Compose(
            oidc,
            new AdminSamlOperationalHealthResponse { Saml2Enabled = true },
            new ArchLucidSamlAuthOptions { Enabled = true, Issuer = "", RoleClaimSources = [] },
            tenantIdentityProvider: null);

        response.SpEntityIdConfigured.Should().BeFalse();
        response.SamlRoleClaimSourcesConfigured.Should().BeFalse();
        response.MisconfigurationHints.Should().Contain(h => h.Contains("Saml2:Issuer", StringComparison.Ordinal));
        response.MisconfigurationHints.Should().Contain(h => h.Contains("RoleClaimSources", StringComparison.Ordinal));
    }

    [Fact]
    public void Compose_tenant_row_without_role_mapping_emits_wizard_hint()
    {
        AdminOidcDiagnosticsResponse oidc = new()
        {
            AuthMode = "JwtBearer",
            ConfiguredAuthority = "https://idp.example/",
            ConfiguredAudience = "api",
            DiscoveryAttempted = true,
            DiscoverySucceeded = true,
        };

        TenantIdentityProviderConfigurationRecord tenant = new()
        {
            TenantId = Guid.NewGuid(),
            Protocol = TenantIdentityProtocol.Oidc,
            IssuerUri = "https://idp.example/",
            MetadataXml = "<EntityDescriptor />",
            ClaimMappingJson = """{"RoleClaimName":"","Mappings":[]}""",
            KeyVaultSecretName = "kv-secret",
            UpdatedUtc = DateTimeOffset.UtcNow,
            UpdatedByActorId = "actor",
            IsActive = true,
        };

        AdminAuthConfigurationDiagnosticsResponse response = AuthConfigurationDiagnosticsComposer.Compose(
            oidc,
            new AdminSamlOperationalHealthResponse { Saml2Enabled = false },
            new ArchLucidSamlAuthOptions(),
            tenant);

        response.TenantClaimMappingConfigured.Should().BeFalse();
        response.TenantIdentityProviderProtocol.Should().Be("Oidc");
        response.MisconfigurationHints.Should().Contain(h => h.Contains("ClaimMappingJson", StringComparison.Ordinal));
    }

    [Fact]
    public void Compose_ApiKey_mode_returns_informational_hint_only()
    {
        AdminOidcDiagnosticsResponse oidc = new() { AuthMode = "ApiKey" };

        AdminAuthConfigurationDiagnosticsResponse response = AuthConfigurationDiagnosticsComposer.Compose(
            oidc,
            new AdminSamlOperationalHealthResponse(),
            new ArchLucidSamlAuthOptions(),
            tenantIdentityProvider: null);

        response.MisconfigurationHints.Should().ContainSingle(h => h.Contains("ApiKey", StringComparison.Ordinal));
    }
}
