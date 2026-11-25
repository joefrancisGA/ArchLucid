using System.Security.Claims;
using ArchLucid.Api.Security;
using ArchLucid.Core.Scoping;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RemediationCentralAuthorizationTests
{
    [Fact]
    public async Task Remediation_planning_is_denied_when_approval_service_unconfigured()
    {
        Guid tenant = Guid.NewGuid(), workspace = Guid.NewGuid(),
            project = Guid.NewGuid(), proposal = Guid.NewGuid();
        Mock<IScopeContextProvider> scopes = new();
        scopes.Setup(x => x.GetCurrentScope()).Returns(new ScopeContext
            { TenantId = tenant, WorkspaceId = workspace, ProjectId = project });
        Mock<IAuthorizationService> policy = new();
        policy.Setup(x => x.AuthorizeAsync(It.IsAny<ClaimsPrincipal>(),
            It.IsAny<object>(), It.IsAny<string>()))
            .ReturnsAsync(AuthorizationResult.Success());
        Mock<ICentralAuthorizationAudit> audit = new();
        audit.Setup(x => x.WriteAsync(It.IsAny<CentralAuthorizationAuditRecord>(),
            It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        CentralAuthorizationDecisions decisions = new(
            scopes.Object, Mock.Of<IEvidenceEntitlementAuthority>(), policy.Object,
            audit.Object, TimeProvider.System, new DenyUnconfiguredRemediationApproval());
        ClaimsPrincipal principal = new(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, "operator")], "test"));

        CentralAuthorizationDecision result = await decisions.DecideAsync(
            principal, new CentralAuthorizationRequest(
                "remediation.plan", tenant, workspace, project, proposal));

        result.Allowed.Should().BeFalse();
        result.Reason.Should().Be("remediation_approval_missing");
        policy.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Remediation_execution_remains_unsupported()
    {
        Mock<ICentralAuthorizationAudit> audit = new();
        audit.Setup(x => x.WriteAsync(It.IsAny<CentralAuthorizationAuditRecord>(),
            It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Guid tenant = Guid.NewGuid(), workspace = Guid.NewGuid(),
            project = Guid.NewGuid(), proposal = Guid.NewGuid();
        Mock<IScopeContextProvider> scopes = new();
        scopes.Setup(x => x.GetCurrentScope()).Returns(new ScopeContext
            { TenantId = tenant, WorkspaceId = workspace, ProjectId = project });
        Mock<IEvidenceEntitlementAuthority> entitlements = new();
        entitlements.Setup(x => x.HasCurrentReadEntitlementAsync(
            It.IsAny<ClaimsPrincipal>(), It.IsAny<EvidenceReadResource>(),
            It.IsAny<CancellationToken>())).ReturnsAsync(true);
        Mock<IAuthorizationService> policy = new();
        policy.Setup(x => x.AuthorizeAsync(It.IsAny<ClaimsPrincipal>(),
            It.IsAny<object>(), It.IsAny<string>()))
            .ReturnsAsync(AuthorizationResult.Success());
        Mock<IRemediationApprovalAuthority> approvals = new();
        approvals.Setup(x => x.IsApprovedAsync(It.IsAny<ClaimsPrincipal>(),
            It.IsAny<CentralAuthorizationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        CentralAuthorizationDecisions decisions = new(
            scopes.Object, entitlements.Object, policy.Object, audit.Object,
            TimeProvider.System, approvals.Object);
        ClaimsPrincipal principal = new(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, "operator")], "test"));
        CentralAuthorizationDecision result = await decisions.DecideAsync(
            principal, new CentralAuthorizationRequest(
                "remediation.execute", tenant, workspace, project, proposal));
        result.Allowed.Should().BeFalse();
        result.Reason.Should().Be("invalid_identity_action_or_resource");
        entitlements.VerifyNoOtherCalls();
        approvals.VerifyNoOtherCalls();
        policy.VerifyNoOtherCalls();
    }
}
