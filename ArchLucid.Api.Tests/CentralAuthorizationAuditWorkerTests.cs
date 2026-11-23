using System.Security.Claims;
using ArchLucid.Api.Security;
using ArchLucid.Core.Scoping;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CentralAuthorizationAuditWorkerTests
{
    [Fact]
    public async Task Audit_failure_must_not_allow_access()
    {
        Guid tenant = Guid.NewGuid(), workspace = Guid.NewGuid(),
            project = Guid.NewGuid(), resource = Guid.NewGuid();
        Mock<IScopeContextProvider> scopes = new();
        scopes.Setup(x => x.GetCurrentScope()).Returns(new ScopeContext
            { TenantId = tenant, WorkspaceId = workspace, ProjectId = project });
        Mock<IEvidenceEntitlementAuthority> entitlements = new();
        entitlements.Setup(x => x.HasCurrentReadEntitlementAsync(
            It.IsAny<ClaimsPrincipal>(), It.IsAny<EvidenceReadResource>(),
            It.IsAny<CancellationToken>())).ReturnsAsync(true);
        Mock<IAuthorizationService> policies = new();
        policies.Setup(x => x.AuthorizeAsync(
            It.IsAny<ClaimsPrincipal>(), It.IsAny<object>(), It.IsAny<string>()))
            .ReturnsAsync(AuthorizationResult.Success());
        Mock<ICentralAuthorizationAudit> audit = new();
        audit.Setup(x => x.WriteAsync(
            It.IsAny<CentralAuthorizationAuditRecord>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit unavailable"));

        CentralAuthorizationDecisions service = new(
            scopes.Object, entitlements.Object, policies.Object, audit.Object, TimeProvider.System, new DenyUnconfiguredRemediationApproval());
        ClaimsPrincipal principal = new(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, "operator")], "test"));
        CentralAuthorizationDecision decision = await service.DecideAsync(principal,
            new CentralAuthorizationRequest("evidence.read", tenant, workspace, project, resource));
        decision.Allowed.Should().BeFalse();
        decision.Reason.Should().Be("audit_unavailable");
    }

    [Fact]
    public async Task Worker_without_trusted_identity_is_denied_before_policy()
    {
        Mock<ICentralAuthorizationDecisions> decisions = new();
        WorkerAuthorizationAdapter adapter = new(new DenyUnconfiguredWorkerIdentity(), decisions.Object);
        CentralAuthorizationDecision decision = await adapter.DecideAsync(
            new CentralAuthorizationRequest("evidence.read", Guid.NewGuid(),
                Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()));
        decision.Allowed.Should().BeFalse();
        decisions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Worker_with_unauthenticated_principal_is_denied_before_policy()
    {
        ClaimsPrincipal principal = new(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, "worker")]));
        Mock<ITrustedWorkerIdentity> identity = new();
        identity.Setup(x => x.ResolveAsync(It.IsAny<CancellationToken>())).ReturnsAsync(principal);
        Mock<ICentralAuthorizationDecisions> decisions = new();

        CentralAuthorizationDecision result = await new WorkerAuthorizationAdapter(
            identity.Object, decisions.Object).DecideAsync(
            new CentralAuthorizationRequest("evidence.read", Guid.NewGuid(),
                Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()));

        result.Allowed.Should().BeFalse();
        result.Reason.Should().Be("worker_identity_unavailable");
        decisions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Worker_identity_resolution_failure_is_denied_before_policy()
    {
        Mock<ITrustedWorkerIdentity> identity = new();
        identity.Setup(x => x.ResolveAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("identity provider unavailable"));
        Mock<ICentralAuthorizationDecisions> decisions = new();

        CentralAuthorizationDecision result = await new WorkerAuthorizationAdapter(
            identity.Object, decisions.Object).DecideAsync(
            new CentralAuthorizationRequest("evidence.read", Guid.NewGuid(),
                Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()));

        result.Allowed.Should().BeFalse();
        result.Reason.Should().Be("worker_authorization_unavailable");
        decisions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Worker_caller_cancellation_does_not_become_authorization_denial()
    {
        using CancellationTokenSource cancellation = new();
        cancellation.Cancel();
        Mock<ITrustedWorkerIdentity> identity = new();
        identity.Setup(x => x.ResolveAsync(cancellation.Token))
            .ThrowsAsync(new OperationCanceledException(cancellation.Token));
        Mock<ICentralAuthorizationDecisions> decisions = new();

        Func<Task> action = () => new WorkerAuthorizationAdapter(
            identity.Object, decisions.Object).DecideAsync(
            new CentralAuthorizationRequest("evidence.read", Guid.NewGuid(),
                Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()), cancellation.Token);

        await action.Should().ThrowAsync<OperationCanceledException>();
        decisions.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Worker_central_authorization_unavailable_is_denied()
    {
        ClaimsPrincipal principal = new(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, "worker")], "trusted-worker"));
        Mock<ITrustedWorkerIdentity> identity = new();
        identity.Setup(x => x.ResolveAsync(It.IsAny<CancellationToken>())).ReturnsAsync(principal);
        Mock<ICentralAuthorizationDecisions> decisions = new();
        decisions.Setup(x => x.DecideAsync(principal,
                It.IsAny<CentralAuthorizationRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("central service unavailable"));

        CentralAuthorizationDecision result = await new WorkerAuthorizationAdapter(
            identity.Object, decisions.Object).DecideAsync(
            new CentralAuthorizationRequest("evidence.read", Guid.NewGuid(),
                Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()));

        result.Allowed.Should().BeFalse();
        result.Reason.Should().Be("worker_authorization_unavailable");
        decisions.Verify(x => x.DecideAsync(principal,
            It.IsAny<CentralAuthorizationRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Worker_uses_central_service_when_trusted_identity_exists()
    {
        ClaimsPrincipal principal = new(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, "worker")], "trusted-worker"));
        Mock<ITrustedWorkerIdentity> identity = new();
        identity.Setup(x => x.ResolveAsync(It.IsAny<CancellationToken>())).ReturnsAsync(principal);
        Mock<ICentralAuthorizationDecisions> decisions = new();
        decisions.Setup(x => x.DecideAsync(principal, It.IsAny<CentralAuthorizationRequest>(),
            It.IsAny<CancellationToken>())).ReturnsAsync(new CentralAuthorizationDecision(false, "no_acl"));
        WorkerAuthorizationAdapter adapter = new(identity.Object, decisions.Object);
        CentralAuthorizationDecision decision = await adapter.DecideAsync(
            new CentralAuthorizationRequest("evidence.read", Guid.NewGuid(),
                Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()));
        decision.Allowed.Should().BeFalse();
        decisions.Verify(x => x.DecideAsync(principal, It.IsAny<CentralAuthorizationRequest>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
