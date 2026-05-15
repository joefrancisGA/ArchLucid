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

    private static ClaimsIdentity CreateSamlIdentity(params Claim[] claims) =>
        new(claims, Saml2Constants.AuthenticationScheme);
}
