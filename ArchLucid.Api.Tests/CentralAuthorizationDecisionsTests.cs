using System.Security.Claims;
using ArchLucid.Api.Security;
using ArchLucid.Core.Scoping;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CentralAuthorizationDecisionsTests
{
    private static readonly Guid Tenant = Guid.NewGuid();
    private static readonly Guid Workspace = Guid.NewGuid();
    private static readonly Guid Project = Guid.NewGuid();
    private static readonly Guid Run = Guid.NewGuid();
    private static ClaimsPrincipal Principal() =>
        new(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "operator")], "test"));

    private static (CentralAuthorizationDecisions Service,
        Mock<IEvidenceEntitlementAuthority> Entitlements,
        Mock<IAuthorizationService> Policy) Build(bool allowed = true)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
            { TenantId = Tenant, WorkspaceId = Workspace, ProjectId = Project });
        Mock<IEvidenceEntitlementAuthority> entitlements = new();
        entitlements.Setup(e => e.HasCurrentReadEntitlementAsync(
            It.IsAny<ClaimsPrincipal>(), It.IsAny<EvidenceReadResource>(),
            It.IsAny<CancellationToken>())).ReturnsAsync(allowed);
        Mock<IAuthorizationService> policy = new();
        policy.Setup(p => p.AuthorizeAsync(
            It.IsAny<ClaimsPrincipal>(), It.IsAny<object>(), It.IsAny<string>()))
            .ReturnsAsync(AuthorizationResult.Success());
        Mock<ICentralAuthorizationAudit> audit = new();
        audit.Setup(a => a.WriteAsync(
            It.IsAny<CentralAuthorizationAuditRecord>(),
            It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        return (new CentralAuthorizationDecisions(scope.Object, entitlements.Object, policy.Object, audit.Object, TimeProvider.System, new DenyUnconfiguredRemediationApproval()),
            entitlements, policy);
    }

    private static CentralAuthorizationRequest Request(string action = "evidence.read") =>
        new(action, Tenant, Workspace, Project, Run);

    [Fact]
    public async Task Authorized_resource_is_allowed()
    {
        var (service, _, _) = Build();
        (await service.DecideAsync(Principal(), Request())).Allowed.Should().BeTrue();
    }

    [Fact]
    public async Task Unknown_action_fails_before_entitlement()
    {
        var (service, entitlement, _) = Build();
        (await service.DecideAsync(Principal(), Request("remediation.execute"))).Allowed.Should().BeFalse();
        entitlement.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Foreign_scope_fails_before_entitlement()
    {
        var (service, entitlement, _) = Build();
        (await service.DecideAsync(Principal(),
            new CentralAuthorizationRequest("evidence.read", Guid.NewGuid(), Workspace, Project, Run)))
            .Allowed.Should().BeFalse();
        entitlement.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Revoked_entitlement_denied_before_policy()
    {
        var (service, _, policy) = Build(false);
        (await service.DecideAsync(Principal(), Request())).Allowed.Should().BeFalse();
        policy.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Entitlement_outage_fails_closed()
    {
        var (service, entitlement, _) = Build();
        entitlement.Setup(e => e.HasCurrentReadEntitlementAsync(
            It.IsAny<ClaimsPrincipal>(), It.IsAny<EvidenceReadResource>(),
            It.IsAny<CancellationToken>())).ThrowsAsync(new InvalidOperationException());
        (await service.DecideAsync(Principal(), Request())).Allowed.Should().BeFalse();
    }
}
