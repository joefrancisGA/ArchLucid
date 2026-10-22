using System.Security.Claims;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Auth.Services;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using ITfoxtec.Identity.Saml2.Schemas;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Auth")]
public sealed class ArchLucidRoleClaimsTransformationSamlTests
{
    [Fact]
    public async Task TransformAsync_runs_saml_inbound_mapping_before_permissions()
    {
        Mock<IRoleSyncService> roleSync = new();
        roleSync
            .Setup(s => s.ApplyEntraJwtAndDirectoryOverridesAsync(It.IsAny<ClaimsPrincipal>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        IHttpContextAccessor httpContextAccessor = new HttpContextAccessor { HttpContext = new DefaultHttpContext() };
        AuthDiagnosticsRingBuffer diagnostics = new(capacity: 10);
        IOptions<ArchLucidSamlAuthOptions> samlOptions = Options.Create(new ArchLucidSamlAuthOptions
        {
            Enabled = true,
            RoleClaimSources = ["http://idp.example/role"],
            TenantIdClaimType = "http://idp.example/tenant",
            DirectoryObjectIdClaimType = "http://idp.example/oid"
        });

        ArchLucidRoleClaimsTransformation sut = new(
            roleSync.Object,
            httpContextAccessor,
            diagnostics,
            samlOptions);

        Guid tenantId = ScopeIds.DefaultTenant;
        ClaimsIdentity id = new(
            new Claim[]
            {
                new("http://idp.example/role", ArchLucidRoles.Operator),
                new("http://idp.example/tenant", tenantId.ToString()),
                new("http://idp.example/oid", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
            },
            Saml2Constants.AuthenticationScheme);

        ClaimsPrincipal input = new(id);
        ClaimsPrincipal output = await sut.TransformAsync(input);

        output.FindFirst("tenant_id")?.Value.Should().Be(tenantId.ToString());
        output.FindFirst("oid")?.Value.Should().Be("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        output.HasClaim("permission", "commit:run").Should().BeTrue();
    }
}
