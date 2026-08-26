using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Contracts.Alerts.Delivery;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

using FluentAssertions;

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

        GovernanceSetupController controller = new(
            scopeProvider.Object,
            resolver.Object,
            subscriptions.Object);

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
}
