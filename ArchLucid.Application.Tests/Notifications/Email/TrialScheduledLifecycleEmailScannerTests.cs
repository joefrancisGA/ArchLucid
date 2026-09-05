using ArchLucid.Application.Notifications.Email;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.IntegrationOutbox;

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
        Guid tenantId = Guid.Parse("40404040-4040-4040-4040-404040404040");
        DateTimeOffset utcNow = new(2026, 9, 3, 12, 0, 0, TimeSpan.Zero);
        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "Acme",
            TrialStatus = "active",
            TrialStartUtc = utcNow.AddDays(-8),
            TrialExpiresUtc = utcNow.AddDays(5),
        };
        TenantWorkspaceLink workspaceLink = new()
        {
            WorkspaceId = Guid.Parse("41414141-4141-4141-4141-414141414141"),
            DefaultProjectId = Guid.Parse("42424242-4242-4242-4242-424242424242"),
        };

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(repository => repository.ListAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([tenant]);
        tenants.Setup(repository => repository.GetFirstWorkspaceAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(workspaceLink);

        Mock<IIntegrationEventOutboxRepository> outbox = new();
        Mock<IIntegrationEventPublisher> publisher = new();
        publisher.Setup(p => p.PublishAsync(
                It.IsAny<string>(),
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.IsAny<string?>(),
                It.IsAny<IReadOnlyDictionary<string, object>?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<IntegrationEventsOptions>> integrationOpts = new();
        integrationOpts.Setup(m => m.CurrentValue).Returns(new IntegrationEventsOptions { TransactionalOutboxEnabled = false });
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

        publisher.Verify(
            p => p.PublishAsync(
                IntegrationEventTypes.TrialLifecycleEmailV1,
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.Is<string?>(messageId => messageId != null && messageId.Contains("MidTrialDay7", StringComparison.Ordinal)),
                It.IsAny<IReadOnlyDictionary<string, object>?>(),
                It.IsAny<CancellationToken>()),
            Times.Once,
            "lowercase active trial status must be scanned like canonical Active");
    }

    [Fact]
    public async Task PublishDueAsync_publishes_mid_trial_for_padded_active_trial_status()
    {
        Guid tenantId = Guid.Parse("43434343-4343-4343-4343-434343434343");
        DateTimeOffset utcNow = new(2026, 9, 3, 12, 0, 0, TimeSpan.Zero);
        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "Acme",
            TrialStatus = " active ",
            TrialStartUtc = utcNow.AddDays(-8),
            TrialExpiresUtc = utcNow.AddDays(5),
        };
        TenantWorkspaceLink workspaceLink = new()
        {
            WorkspaceId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            DefaultProjectId = Guid.Parse("45454545-4545-4545-4545-454545454545"),
        };

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(repository => repository.ListAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([tenant]);
        tenants.Setup(repository => repository.GetFirstWorkspaceAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(workspaceLink);

        Mock<IIntegrationEventOutboxRepository> outbox = new();
        Mock<IIntegrationEventPublisher> publisher = new();
        publisher.Setup(p => p.PublishAsync(
                It.IsAny<string>(),
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.IsAny<string?>(),
                It.IsAny<IReadOnlyDictionary<string, object>?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<IntegrationEventsOptions>> integrationOpts = new();
        integrationOpts.Setup(m => m.CurrentValue).Returns(new IntegrationEventsOptions { TransactionalOutboxEnabled = false });
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

        publisher.Verify(
            p => p.PublishAsync(
                IntegrationEventTypes.TrialLifecycleEmailV1,
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.Is<string?>(messageId => messageId != null && messageId.Contains("MidTrialDay7", StringComparison.Ordinal)),
                It.IsAny<IReadOnlyDictionary<string, object>?>(),
                It.IsAny<CancellationToken>()),
            Times.Once,
            "padded active trial status must be scanned like canonical Active");
    }

    [Fact]
    public async Task PublishDueAsync_publishes_expired_trigger_when_trial_status_already_expired()
    {
        Guid tenantId = Guid.Parse("53535353-5353-5353-5353-535353535353");
        DateTimeOffset utcNow = new(2026, 9, 3, 12, 0, 0, TimeSpan.Zero);
        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "Acme",
            TrialStatus = TrialLifecycleStatus.Expired,
            TrialExpiresUtc = utcNow.AddDays(-1),
        };
        TenantWorkspaceLink workspaceLink = new()
        {
            WorkspaceId = Guid.Parse("54545454-5454-5454-5454-545454545454"),
            DefaultProjectId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
        };

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(repository => repository.ListAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([tenant]);
        tenants.Setup(repository => repository.GetFirstWorkspaceAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(workspaceLink);

        Mock<IIntegrationEventOutboxRepository> outbox = new();
        Mock<IIntegrationEventPublisher> publisher = new();
        publisher.Setup(p => p.PublishAsync(
                It.IsAny<string>(),
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.IsAny<string?>(),
                It.IsAny<IReadOnlyDictionary<string, object>?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<IntegrationEventsOptions>> integrationOpts = new();
        integrationOpts.Setup(m => m.CurrentValue).Returns(new IntegrationEventsOptions { TransactionalOutboxEnabled = false });
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

        publisher.Verify(
            p => p.PublishAsync(
                IntegrationEventTypes.TrialLifecycleEmailV1,
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.Is<string?>(messageId => messageId != null && messageId.Contains("Expired", StringComparison.Ordinal)),
                It.IsAny<IReadOnlyDictionary<string, object>?>(),
                It.IsAny<CancellationToken>()),
            Times.Once,
            "expired tenants must still enqueue trial-ended mail when lifecycle advanced before the email scan");
    }
}
