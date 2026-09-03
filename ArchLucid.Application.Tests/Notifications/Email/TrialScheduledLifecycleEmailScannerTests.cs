using ArchLucid.Application.Notifications.Email;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.IntegrationOutbox;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TrialScheduledLifecycleEmailScannerTests
{
    [SkippableFact]
    public async Task PublishDueAsync_logic_app_owner_skips_without_querying_tenants()
    {
        Mock<ITenantRepository> tenants = new();
        Mock<IIntegrationEventOutboxRepository> outbox = new();
        Mock<IIntegrationEventPublisher> publisher = new();
        Mock<IOptionsMonitor<IntegrationEventsOptions>> integrationOpts = new();
        integrationOpts.Setup(m => m.CurrentValue).Returns(new IntegrationEventsOptions());
        Mock<IOptionsMonitor<TrialLifecycleEmailRoutingOptions>> routing = new();
        routing.Setup(m => m.CurrentValue).Returns(
            new TrialLifecycleEmailRoutingOptions { Owner = TrialLifecycleEmailRoutingOptions.OwnerModes.LogicApp, });

        TrialScheduledLifecycleEmailScanner sut = new(
            tenants.Object,
            outbox.Object,
            publisher.Object,
            integrationOpts.Object,
            routing.Object,
            Mock.Of<ILogger<TrialScheduledLifecycleEmailScanner>>());

        await sut.PublishDueAsync(TimeProvider.System.GetUtcNow(), CancellationToken.None);

        tenants.Verify(repository => repository.ListAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task PublishDueAsync_publishes_mid_trial_for_lowercase_active_trial_status()
    {
        Guid tenantId = Guid.Parse("3d3d3d3d-3d3d-3d3d-3d3d-3d3d3d3d3d3d");
        Guid workspaceId = Guid.Parse("3e3e3e3e-3e3e-3e3e-3e3e-3e3e3e3e3e3e");
        Guid projectId = Guid.Parse("3f3f3f3f-3f3f-3f3f-3f3f-3f3f3f3f3f3f");
        DateTimeOffset utcNow = new(2026, 1, 15, 12, 0, 0, TimeSpan.Zero);

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(r => r.ListAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]
            {
                new TenantRecord
                {
                    Id = tenantId,
                    Name = "Acme",
                    TrialStatus = "active",
                    TrialStartUtc = utcNow.AddDays(-8),
                    TrialExpiresUtc = utcNow.AddDays(22),
                },
            });
        tenants.Setup(r => r.GetFirstWorkspaceAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantWorkspaceLink
            {
                WorkspaceId = workspaceId,
                DefaultProjectId = projectId,
            });

        Mock<IIntegrationEventOutboxRepository> outbox = new();
        outbox.Setup(o => o.EnqueueAsync(
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IIntegrationEventPublisher> publisher = new();
        Mock<IOptionsMonitor<IntegrationEventsOptions>> integrationOpts = new();
        integrationOpts.Setup(m => m.CurrentValue).Returns(new IntegrationEventsOptions { TransactionalOutboxEnabled = true });
        Mock<IOptionsMonitor<TrialLifecycleEmailRoutingOptions>> routing = new();
        routing.Setup(m => m.CurrentValue).Returns(new TrialLifecycleEmailRoutingOptions());

        TrialScheduledLifecycleEmailScanner sut = new(
            tenants.Object,
            outbox.Object,
            publisher.Object,
            integrationOpts.Object,
            routing.Object,
            Mock.Of<ILogger<TrialScheduledLifecycleEmailScanner>>());

        await sut.PublishDueAsync(utcNow, CancellationToken.None);

        outbox.Verify(
            o => o.EnqueueAsync(
                null,
                IntegrationEventTypes.TrialLifecycleEmailV1,
                It.Is<string>(id => id.Contains(TrialLifecycleEmailTrigger.MidTrialDay7.ToString(), StringComparison.Ordinal)),
                It.IsAny<ReadOnlyMemory<byte>>(),
                tenantId,
                workspaceId,
                projectId,
                It.IsAny<CancellationToken>()),
            Times.Once,
            "lowercase active trial status must not suppress scheduled mid-trial lifecycle scan");
    }
}
