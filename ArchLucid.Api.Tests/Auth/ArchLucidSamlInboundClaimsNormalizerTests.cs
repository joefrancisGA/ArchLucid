using System.Security.Claims;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Auth.Services;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using ITfoxtec.Identity.Saml2.Schemas;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Auth")]
public sealed class ArchLucidSamlInboundClaimsNormalizerTests
{
    [Fact]
    public void Apply_when_disabled_is_noop()
    {
        ClaimsIdentity identity = CreateSamlIdentity(new Claim("http://idp/role", ArchLucidRoles.Admin));

        ArchLucidSamlInboundClaimsNormalizer.Apply(
            identity,
            new ArchLucidSamlAuthOptions { Enabled = false, RoleClaimSources = ["http://idp/role"] });

        identity.HasClaim("roles", ArchLucidRoles.Admin).Should().BeFalse();
    }

    [Fact]
    public void Apply_when_not_saml_authentication_type_is_noop()
    {
        ClaimsIdentity identity = new(new Claim[]
        {
            new("http://idp/role", ArchLucidRoles.Admin)
        }, "Bearer");

        ArchLucidSamlInboundClaimsNormalizer.Apply(
            identity,
            new ArchLucidSamlAuthOptions { Enabled = true, RoleClaimSources = ["http://idp/role"] });

        identity.HasClaim("roles", ArchLucidRoles.Admin).Should().BeFalse();
    }

    [Fact]
    public void Apply_promotes_scope_claims_when_source_claim_type_differs_by_case()
    {
        Guid tenantId = ScopeIds.DefaultTenant;
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        ClaimsIdentity identity = CreateSamlIdentity(
            new Claim("HTTP://IDP.EXAMPLE/TENANT", tenantId.ToString()),
            new Claim("http://idp.example/WORKSPACE", workspaceId.ToString()),
            new Claim("http://idp.example/Project", projectId.ToString()),
            new Claim("HTTP://IDP.EXAMPLE/OID", "00000000-0000-0000-0000-0000000000ad"));

        ArchLucidSamlInboundClaimsNormalizer.Apply(
            identity,
            new ArchLucidSamlAuthOptions
            {
                Enabled = true,
                TenantIdClaimType = "http://idp.example/tenant",
                WorkspaceIdClaimType = "http://idp.example/workspace",
                ProjectIdClaimType = "http://idp.example/project",
                DirectoryObjectIdClaimType = "http://idp.example/oid"
            });

        identity.FindFirst("tenant_id")?.Value.Should().Be(tenantId.ToString());
        identity.FindFirst("workspace_id")?.Value.Should().Be(workspaceId.ToString());
        identity.FindFirst("project_id")?.Value.Should().Be(projectId.ToString());
        identity.FindFirst("oid")?.Value.Should().Be("00000000-0000-0000-0000-0000000000ad");
    }

    [Fact]
    public void Apply_promotes_role_sources_scope_and_oid()
    {
        Guid tenantId = ScopeIds.DefaultTenant;
        ClaimsIdentity identity = CreateSamlIdentity(
            new Claim("http://idp.example/role", ArchLucidRoles.Operator),
            new Claim("http://idp.example/tenant", tenantId.ToString()),
            new Claim("http://idp.example/oid", "00000000-0000-0000-0000-0000000000ad"));

        ArchLucidSamlInboundClaimsNormalizer.Apply(
            identity,
            new ArchLucidSamlAuthOptions
            {
                Enabled = true,
                RoleClaimSources = ["http://idp.example/role"],
                TenantIdClaimType = "http://idp.example/tenant",
                WorkspaceIdClaimType = "http://idp.example/ws",
                ProjectIdClaimType = "http://idp.example/proj",
                DirectoryObjectIdClaimType = "http://idp.example/oid"
            });

        identity.HasClaim("roles", ArchLucidRoles.Operator).Should().BeTrue();
        identity.HasClaim(ClaimTypes.Role, ArchLucidRoles.Operator).Should().BeTrue();
        identity.FindFirst("tenant_id")?.Value.Should().Be(tenantId.ToString());
        identity.FindFirst("oid")?.Value.Should().Be("00000000-0000-0000-0000-0000000000ad");
    }

    [Fact]
    public void Apply_skips_non_guid_scope_values_when_promoting_tenant_workspace_project()
    {
        ClaimsIdentity identity = CreateSamlIdentity(
            new Claim("http://idp.example/tenant", "division-east"),
            new Claim("http://idp.example/workspace", "not-a-guid"),
            new Claim("http://idp.example/project", "also-not-a-guid"));

        ArchLucidSamlInboundClaimsNormalizer.Apply(
            identity,
            new ArchLucidSamlAuthOptions
            {
                Enabled = true,
                TenantIdClaimType = "http://idp.example/tenant",
                WorkspaceIdClaimType = "http://idp.example/workspace",
                ProjectIdClaimType = "http://idp.example/project"
            });

        identity.HasClaim("tenant_id", "division-east").Should().BeFalse();
        identity.HasClaim("workspace_id", "not-a-guid").Should().BeFalse();
        identity.HasClaim("project_id", "also-not-a-guid").Should().BeFalse();
    }

    [Fact]
    public void Apply_replaces_conflicting_scope_claim_with_configured_source_value()
    {
        Guid wrongTenantId = Guid.NewGuid();
        Guid correctTenantId = ScopeIds.DefaultTenant;
        Guid wrongWorkspaceId = Guid.NewGuid();
        Guid correctWorkspaceId = Guid.NewGuid();

        ClaimsIdentity identity = CreateSamlIdentity(
            new Claim("tenant_id", wrongTenantId.ToString("D")),
            new Claim("workspace_id", wrongWorkspaceId.ToString("D")),
            new Claim("http://idp.example/tenant", correctTenantId.ToString("D")),
            new Claim("http://idp.example/workspace", correctWorkspaceId.ToString("D")));

        ArchLucidSamlInboundClaimsNormalizer.Apply(
            identity,
            new ArchLucidSamlAuthOptions
            {
                Enabled = true,
                TenantIdClaimType = "http://idp.example/tenant",
                WorkspaceIdClaimType = "http://idp.example/workspace",
            });

        identity.Claims.Count(static c => c.Type == "tenant_id").Should().Be(1);
        identity.Claims.Count(static c => c.Type == "workspace_id").Should().Be(1);
        identity.FindFirst("tenant_id")!.Value.Should().Be(correctTenantId.ToString("D"));
        identity.FindFirst("workspace_id")!.Value.Should().Be(correctWorkspaceId.ToString("D"));
    }

    [Fact]
    public void Apply_skips_ambiguous_multi_valued_scope_source_claims()
    {
        Guid firstTenantId = Guid.NewGuid();
        Guid secondTenantId = ScopeIds.DefaultTenant;

        ClaimsIdentity identity = CreateSamlIdentity(
            new Claim("http://idp.example/tenant", firstTenantId.ToString("D")),
            new Claim("http://idp.example/tenant", secondTenantId.ToString("D")));

        ArchLucidSamlInboundClaimsNormalizer.Apply(
            identity,
            new ArchLucidSamlAuthOptions
            {
                Enabled = true,
                TenantIdClaimType = "http://idp.example/tenant",
            });

        identity.FindFirst("tenant_id").Should().BeNull();
    }

    private static ClaimsIdentity CreateSamlIdentity(params Claim[] claims) =>
        new(claims, Saml2Constants.AuthenticationScheme);
}
