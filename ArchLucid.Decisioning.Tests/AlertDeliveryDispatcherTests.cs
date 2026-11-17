using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Delivery;
using ArchLucid.Persistence.Alerts;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
/// Tests for Alert Delivery Dispatcher.
/// </summary>

[Trait("Category", "Unit")]
public sealed class AlertDeliveryDispatcherTests
{
    [Fact]
    public async Task DeliverAsync_WhenAlertIsNull_ThrowsArgumentNullException()
    {
        AlertDeliveryDispatcher sut = CreateSut(
            Mock.Of<IEnumerable<IAlertDeliveryChannel>>(),
            Mock.Of<IAlertRoutingSubscriptionRepository>(),
            Mock.Of<IAlertDeliveryAttemptRepository>(),
            Mock.Of<IAuditService>());

        Func<Task> act = async () => await sut.DeliverAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task DeliverAsync_WhenNoMatchingSubscriptions_DoesNotSend()
    {
        Mock<IAlertRoutingSubscriptionRepository> routing = new();
        routing
            .Setup(x => x.ListEnabledByScopeAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAlertDeliveryChannel> channel = new();
        channel.Setup(x => x.ChannelType).Returns(AlertRoutingChannelType.Email);

        AlertDeliveryDispatcher sut = CreateSut(
            [channel.Object],
            routing.Object,
            Mock.Of<IAlertDeliveryAttemptRepository>(),
            Mock.Of<IAuditService>());

        AlertRecord alert = CreateAlert(AlertSeverity.Critical);

        await sut.DeliverAsync(alert, CancellationToken.None);

        channel.Verify(
            x => x.SendAsync(It.IsAny<AlertDeliveryPayload>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeliverAsync_WhenChannelSucceeds_AuditsSuccessAndUpdatesSubscription()
    {
        AlertRoutingSubscription subscription = new()
        {
            RoutingSubscriptionId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            ChannelType = AlertRoutingChannelType.Email,
            Destination = "oncall@example.com",
            MinimumSeverity = AlertSeverity.Info,
        };

        Mock<IAlertRoutingSubscriptionRepository> routing = new();
        routing
            .Setup(x => x.ListEnabledByScopeAsync(subscription.TenantId, subscription.WorkspaceId, subscription.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([subscription]);

        Mock<IAlertDeliveryAttemptRepository> attempts = new();
        attempts.Setup(x => x.CreateAsync(It.IsAny<AlertDeliveryAttempt>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        attempts.Setup(x => x.UpdateAsync(It.IsAny<AlertDeliveryAttempt>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        routing.Setup(x => x.RecordDeliveryAsync(subscription, It.IsAny<DateTime>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IAlertDeliveryChannel> channel = new();
        channel.Setup(x => x.ChannelType).Returns(AlertRoutingChannelType.Email);
        channel.Setup(x => x.SendAsync(It.IsAny<AlertDeliveryPayload>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit.Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        AlertDeliveryDispatcher sut = CreateSut(
            [channel.Object],
            routing.Object,
            attempts.Object,
            audit.Object);

        AlertRecord alert = CreateAlert(AlertSeverity.Warning, subscription.TenantId, subscription.WorkspaceId, subscription.ProjectId);

        await sut.DeliverAsync(alert, CancellationToken.None);

        audit.Verify(
            x => x.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.AlertDeliverySucceeded),
                It.IsAny<CancellationToken>()),
            Times.Once);
        routing.Verify(x => x.RecordDeliveryAsync(subscription, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeliverAsync_PreservesRoutingChangesMadeDuringSend()
    {
        AlertRecord alert = CreateAlert(AlertSeverity.Warning);
        AlertRoutingSubscription original = new()
        {
            TenantId = alert.TenantId,
            WorkspaceId = alert.WorkspaceId,
            ProjectId = alert.ProjectId,
            ChannelType = AlertRoutingChannelType.Email,
            Destination = "old@example.com",
            MinimumSeverity = AlertSeverity.Info,
            IsEnabled = true,
        };
        AlertRoutingSubscription edited = new()
        {
            RoutingSubscriptionId = original.RoutingSubscriptionId,
            TenantId = original.TenantId,
            WorkspaceId = original.WorkspaceId,
            ProjectId = original.ProjectId,
            ChannelType = original.ChannelType,
            Destination = "new@example.com",
            MinimumSeverity = AlertSeverity.Critical,
            IsEnabled = false,
        };
        InMemoryAlertRoutingSubscriptionRepository routing = new();
        await routing.CreateAsync(original, CancellationToken.None);
        Mock<IAlertDeliveryChannel> channel = new();
        channel.Setup(x => x.ChannelType).Returns(AlertRoutingChannelType.Email);
        channel.Setup(x => x.SendAsync(It.IsAny<AlertDeliveryPayload>(), It.IsAny<CancellationToken>()))
            .Returns((AlertDeliveryPayload _, CancellationToken ct) => routing.UpdateAsync(edited, ct));
        AlertDeliveryDispatcher sut = CreateSut([channel.Object], routing,
            Mock.Of<IAlertDeliveryAttemptRepository>(), Mock.Of<IAuditService>());

        await sut.DeliverAsync(alert, CancellationToken.None);

        ScopeContext scope = new()
        {
            TenantId = alert.TenantId,
            WorkspaceId = alert.WorkspaceId,
            ProjectId = alert.ProjectId,
        };
        AlertRoutingSubscription? stored =
            await routing.GetByIdAsync(scope, original.RoutingSubscriptionId, CancellationToken.None);
        stored.Should().NotBeNull();
        stored!.IsEnabled.Should().BeFalse();
        stored.Destination.Should().Be(edited.Destination);
        stored.MinimumSeverity.Should().Be(edited.MinimumSeverity);
        stored.LastDeliveredUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task DeliverAsync_WhenSuccessAuditFails_PreservesSuccessfulDelivery()
    {
        AlertRecord alert = CreateAlert(AlertSeverity.Warning);
        AlertRoutingSubscription subscription = new()
        {
            TenantId = alert.TenantId,
            WorkspaceId = alert.WorkspaceId,
            ProjectId = alert.ProjectId,
            ChannelType = AlertRoutingChannelType.Email,
            Destination = "oncall@example.com",
            MinimumSeverity = AlertSeverity.Info,
        };
        InMemoryAlertRoutingSubscriptionRepository routing = new();
        await routing.CreateAsync(subscription, CancellationToken.None);
        InMemoryAlertDeliveryAttemptRepository attempts = new();
        Mock<IAlertDeliveryChannel> channel = new();
        channel.Setup(x => x.ChannelType).Returns(AlertRoutingChannelType.Email);
        channel.Setup(x => x.SendAsync(It.IsAny<AlertDeliveryPayload>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        Mock<IAuditService> audit = new();
        audit.Setup(x => x.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.AlertDeliverySucceeded),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit storage unavailable"));
        AlertDeliveryDispatcher sut = CreateSut([channel.Object], routing, attempts, audit.Object);

        await sut.DeliverAsync(alert, CancellationToken.None);

        ScopeContext scope = new()
        {
            TenantId = alert.TenantId,
            WorkspaceId = alert.WorkspaceId,
            ProjectId = alert.ProjectId,
        };
        IReadOnlyList<AlertDeliveryAttempt> history =
            await attempts.ListByAlertAsync(scope, alert.AlertId, CancellationToken.None);
        history.Should().ContainSingle().Which.Status.Should().Be(AlertDeliveryAttemptStatus.Succeeded);
        audit.Verify(x => x.LogAsync(
            It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.AlertDeliveryFailed),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeliverAsync_WhenChannelFails_AuditsFailureWithoutThrowing()
    {
        AlertRoutingSubscription subscription = new()
        {
            RoutingSubscriptionId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            ChannelType = AlertRoutingChannelType.Email,
            Destination = "bad",
            MinimumSeverity = AlertSeverity.Info,
        };

        Mock<IAlertRoutingSubscriptionRepository> routing = new();
        routing
            .Setup(x => x.ListEnabledByScopeAsync(subscription.TenantId, subscription.WorkspaceId, subscription.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([subscription]);

        Mock<IAlertDeliveryAttemptRepository> attempts = new();
        attempts.Setup(x => x.CreateAsync(It.IsAny<AlertDeliveryAttempt>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        attempts.Setup(x => x.UpdateAsync(It.IsAny<AlertDeliveryAttempt>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IAlertDeliveryChannel> channel = new();
        channel.Setup(x => x.ChannelType).Returns(AlertRoutingChannelType.Email);
        channel
            .Setup(x => x.SendAsync(It.IsAny<AlertDeliveryPayload>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("webhook failed"));

        Mock<IAuditService> audit = new();
        audit.Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        AlertDeliveryDispatcher sut = CreateSut(
            [channel.Object],
            routing.Object,
            attempts.Object,
            audit.Object);

        AlertRecord alert = CreateAlert(AlertSeverity.Warning, subscription.TenantId, subscription.WorkspaceId, subscription.ProjectId);

        await sut.Invoking(x => x.DeliverAsync(alert, CancellationToken.None)).Should().NotThrowAsync();

        audit.Verify(
            x => x.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.AlertDeliveryFailed),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static AlertDeliveryDispatcher CreateSut(
        IEnumerable<IAlertDeliveryChannel> channels,
        IAlertRoutingSubscriptionRepository subscriptionRepository,
        IAlertDeliveryAttemptRepository attemptRepository,
        IAuditService auditService) =>
        new(
            channels,
            subscriptionRepository,
            attemptRepository,
            auditService,
            CreateSealedManifestAuthorityMock(),
            CreateSealedManifestHashMock());

    private static IAuthorityQueryService CreateSealedManifestAuthorityMock()
    {
        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailForManifestCompareAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken _) =>
                new RunDetailDto
                {
                    Run = new RunRecord { RunId = runId },
                    GoldenManifest = new ManifestDocument
                    {
                        RunId = runId,
                        ManifestHash = "sealed-hash",
                    },
                });

        return authority.Object;
    }

    private static IManifestHashService CreateSealedManifestHashMock()
    {
        Mock<IManifestHashService> manifestHash = new();
        manifestHash.Setup(m => m.ComputeHash(It.IsAny<ManifestDocument>())).Returns("sealed-hash");

        return manifestHash.Object;
    }

    private static AlertRecord CreateAlert(
        string severity,
        Guid? tenantId = null,
        Guid? workspaceId = null,
        Guid? projectId = null) =>
        new()
        {
            AlertId = Guid.NewGuid(),
            TenantId = tenantId ?? Guid.NewGuid(),
            WorkspaceId = workspaceId ?? Guid.NewGuid(),
            ProjectId = projectId ?? Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            Severity = severity,
            Title = "t",
        };
}
