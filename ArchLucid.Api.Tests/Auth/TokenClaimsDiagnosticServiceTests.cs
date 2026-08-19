using System.Security.Claims;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Auth")]
public sealed class TokenClaimsDiagnosticServiceTests
{
    [Fact]
    public async Task DiagnoseAsync_maps_operator_role_and_flags_unknown_claim_value()
    {
        TokenClaimsDiagnosticService sut = CreateService();
        string jwt = SsoWizardSandboxJwtIssuer.IssuePreviewToken(
            ScopeIds.DefaultTenant,
            ScopeIds.DefaultWorkspace,
            ScopeIds.DefaultProject,
            ["Operator", "MysteryGroup"],
            TimeSpan.FromMinutes(5));

        AdminTokenClaimsDiagnosticResponse response =
            await sut.DiagnoseAsync(jwt, CancellationToken.None);

        response.ResolvedRoles.Should().ContainSingle(static role => role == ArchLucidRoles.Operator);
        response.UnmappedValues.Should().ContainSingle(static value => value == "MysteryGroup");
        response.Warnings.Should().Contain(static warning =>
            warning.Contains("signature", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task DiagnoseAsync_identical_tokens_return_same_resolved_roles()
    {
        TokenClaimsDiagnosticService sut = CreateService();
        string jwt = SsoWizardSandboxJwtIssuer.IssuePreviewToken(
            ScopeIds.DefaultTenant,
            ScopeIds.DefaultWorkspace,
            ScopeIds.DefaultProject,
            [ArchLucidRoles.Reader],
            TimeSpan.FromMinutes(5));

        AdminTokenClaimsDiagnosticResponse first =
            await sut.DiagnoseAsync(jwt, CancellationToken.None);
        AdminTokenClaimsDiagnosticResponse second =
            await sut.DiagnoseAsync(jwt, CancellationToken.None);

        first.ResolvedRoles.Should().BeEquivalentTo(second.ResolvedRoles);
    }

    private static TokenClaimsDiagnosticService CreateService()
    {
        Mock<IRoleSyncService> roleSync = new();
        roleSync
            .Setup(static service => service.ApplyEntraJwtAndDirectoryOverridesAsync(
                It.IsAny<ClaimsPrincipal>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        IHttpContextAccessor httpContextAccessor = new HttpContextAccessor { HttpContext = new DefaultHttpContext() };
        AuthDiagnosticsRingBuffer diagnostics = new(capacity: 10);
        IOptions<ArchLucidSamlAuthOptions> samlOptions = Options.Create(new ArchLucidSamlAuthOptions());

        ArchLucidRoleClaimsTransformation transformation = new(
            roleSync.Object,
            httpContextAccessor,
            diagnostics,
            samlOptions);

        return new TokenClaimsDiagnosticService(transformation);
    }
}
