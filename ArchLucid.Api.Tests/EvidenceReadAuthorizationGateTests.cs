using System.Security.Claims;
using ArchLucid.Api.Security;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class EvidenceReadAuthorizationGateTests
{
    private static readonly Guid Tenant = Guid.Parse("11111111-1111-4111-8111-111111111111");
    private static readonly Guid Workspace = Guid.Parse("22222222-2222-4222-8222-222222222222");
    private static readonly Guid Project = Guid.Parse("33333333-3333-4333-8333-333333333333");
    private static readonly Guid Evidence = Guid.Parse("44444444-4444-4444-8444-444444444444");

    private static ClaimsPrincipal Principal(bool authenticated = true) =>
        new(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "operator"),
        new Claim("archlucid.resource_entitlement",
            $"evidence.read:{Tenant:D}:{Workspace:D}:{Project:D}:{Evidence:D}")],
            authenticated ? "test" : null));

    private static (EvidenceReadAuthorizationGate Gate, Mock<IAuthorizationService> Authorization)
        CreateGate(Guid? tenant = null, bool allowed = true)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = tenant ?? Tenant, WorkspaceId = Workspace, ProjectId = Project
        });
        Mock<IAuthorizationService> auth = new();
        auth.Setup(a => a.AuthorizeAsync(
                It.IsAny<ClaimsPrincipal>(), It.IsAny<object>(),
                ArchLucidPolicies.ReadAuthority))
            .ReturnsAsync(allowed ? AuthorizationResult.Success()
                                  : AuthorizationResult.Failed());
        return (new EvidenceReadAuthorizationGate(auth.Object, scope.Object), auth);
    }

    [Fact]
    public async Task Authorized_scoped_read_is_allowed()
    {
        var (gate, auth) = CreateGate();
        EvidenceReadDecision result = await gate.AuthorizeAsync(
            Principal(), Tenant, Workspace, Project, Evidence);
        result.Allowed.Should().BeTrue();
        auth.Verify(a => a.AuthorizeAsync(It.IsAny<ClaimsPrincipal>(),
            It.IsAny<object>(), ArchLucidPolicies.ReadAuthority), Times.Once);
    }

    [Fact]
    public async Task Foreign_tenant_is_denied_before_policy_evaluation()
    {
        var (gate, auth) = CreateGate(Guid.NewGuid());
        EvidenceReadDecision result = await gate.AuthorizeAsync(
            Principal(), Tenant, Workspace, Project, Evidence);
        result.Allowed.Should().BeFalse();
        auth.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Unauthenticated_principal_is_denied()
    {
        var (gate, auth) = CreateGate();
        (await gate.AuthorizeAsync(Principal(false), Tenant, Workspace, Project, Evidence))
            .Allowed.Should().BeFalse();
        auth.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Policy_denial_is_fail_closed()
    {
        var (gate, _) = CreateGate(allowed: false);
        (await gate.AuthorizeAsync(Principal(), Tenant, Workspace, Project, Evidence))
            .Allowed.Should().BeFalse();
    }

    [Fact]
    public async Task Missing_exact_resource_entitlement_is_denied()
    {
        var (gate, auth) = CreateGate();
        var identity = new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "operator")], "test");
        (await gate.AuthorizeAsync(new ClaimsPrincipal(identity), Tenant, Workspace, Project, Evidence))
            .Allowed.Should().BeFalse();
        auth.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Empty_evidence_identifier_is_denied()
    {
        var (gate, auth) = CreateGate();
        (await gate.AuthorizeAsync(Principal(), Tenant, Workspace, Project, Guid.Empty))
            .Allowed.Should().BeFalse();
        auth.VerifyNoOtherCalls();
    }
}
