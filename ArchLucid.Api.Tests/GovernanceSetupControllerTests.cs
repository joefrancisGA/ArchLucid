using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Contracts.Alerts.Delivery;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GovernanceSetupControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task GetSetupGuideBundle_lists_only_enabled_alert_routing_subscriptions()
    {
        AlertRoutingSubscription enabled = new()
        {
            RoutingSubscriptionId = Guid.NewGuid(),
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
            IsEnabled = true,
            Name = "enabled-route",
            ChannelType = "email",
            Destination = "ops@contoso.test",
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IPolicyPackResolver> resolver = new();
        resolver
            .Setup(r => r.ResolveAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EffectivePolicyPackSet { Packs = [] });

        Mock<IAlertRoutingSubscriptionRepository> subscriptions = new();
        subscriptions
            .Setup(r => r.ListEnabledByScopeAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([enabled]);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });

        GovernanceSetupController controller = new(
            scopeProvider.Object,
            resolver.Object,
            subscriptions.Object,
            tenants.Object);

        IActionResult action = await controller.GetSetupGuideBundle(CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        GovernanceSetupGuideBundleResponse body =
            ok.Value.Should().BeOfType<GovernanceSetupGuideBundleResponse>().Subject;

        body.AlertRoutingSubscriptions.Should().ContainSingle().Which.Name.Should().Be("enabled-route");
        subscriptions.Verify(
            r => r.ListEnabledByScopeAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                It.IsAny<CancellationToken>()),
            Times.Once);
        subscriptions.Verify(
            r => r.ListByScopeAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetSetupGuideBundle_returns_not_found_when_tenant_missing()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IPolicyPackResolver> resolver = new(MockBehavior.Strict);
        Mock<IAlertRoutingSubscriptionRepository> subscriptions = new(MockBehavior.Strict);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        GovernanceSetupController controller = new(
            scopeProvider.Object,
            resolver.Object,
            subscriptions.Object,
            tenants.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult action = await controller.GetSetupGuideBundle(CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        resolver.VerifyNoOtherCalls();
        subscriptions.VerifyNoOtherCalls();
    }
}
