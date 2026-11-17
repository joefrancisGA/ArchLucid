using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Persistence.Advisory;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
/// Tests for Digest Delivery Dispatcher.
/// </summary>

[Trait("Category", "Unit")]
public sealed class DigestDeliveryDispatcherTests
{
    [Fact]
    public async Task DeliverAsync_WhenDigestIsNull_ThrowsArgumentNullException()
    {
        DigestDeliveryDispatcher sut = CreateSut(
            Mock.Of<IEnumerable<IDigestDeliveryChannel>>(),
            Mock.Of<IDigestSubscriptionRepository>(),
            Mock.Of<IDigestDeliveryAttemptRepository>(),
            Mock.Of<IAuditService>());

        Func<Task> act = async () => await sut.DeliverAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task DeliverAsync_WhenNoSubscriptions_CompletesWithoutSending()
    {
        Mock<IDigestSubscriptionRepository> subscriptions = new();
        subscriptions
            .Setup(x => x.ListEnabledByScopeAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IDigestDeliveryChannel> channel = new();
        channel.Setup(x => x.ChannelType).Returns(DigestDeliveryChannelType.Email);

        DigestDeliveryDispatcher sut = CreateSut(
            [channel.Object],
            subscriptions.Object,
            Mock.Of<IDigestDeliveryAttemptRepository>(),
            Mock.Of<IAuditService>());

        ArchitectureDigest digest = CreateDigest();

        await sut.DeliverAsync(digest, CancellationToken.None);

        channel.Verify(
            x => x.SendAsync(It.IsAny<DigestDeliveryPayload>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeliverAsync_WhenChannelSucceeds_AuditsSuccessAndUpdatesSubscription()
    {
        Guid subscriptionId = Guid.NewGuid();
        DigestSubscription subscription = new()
        {
            SubscriptionId = subscriptionId,
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            ChannelType = DigestDeliveryChannelType.Email,
            Destination = "ops@example.com",
        };

        Mock<IDigestSubscriptionRepository> subscriptions = new();
        subscriptions
            .Setup(x => x.ListEnabledByScopeAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([subscription]);

        Mock<IDigestDeliveryAttemptRepository> attempts = new();
        attempts
            .Setup(x => x.CreateAsync(It.IsAny<DigestDeliveryAttempt>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        attempts
            .Setup(x => x.UpdateAsync(It.IsAny<DigestDeliveryAttempt>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        subscriptions
            .Setup(x => x.RecordDeliveryAsync(subscription, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDigestDeliveryChannel> channel = new();
        channel.Setup(x => x.ChannelType).Returns(DigestDeliveryChannelType.Email);
        channel
            .Setup(x => x.SendAsync(It.IsAny<DigestDeliveryPayload>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit
            .Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        DigestDeliveryDispatcher sut = CreateSut(
            [channel.Object],
            subscriptions.Object,
            attempts.Object,
            audit.Object);

        ArchitectureDigest digest = CreateDigest();

        await sut.DeliverAsync(digest, CancellationToken.None);

        audit.Verify(
            x => x.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.DigestDeliverySucceeded),
                It.IsAny<CancellationToken>()),
            Times.Once);
        subscriptions.Verify(x => x.RecordDeliveryAsync(subscription, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeliverAsync_PreservesSubscriptionSettingsChangedDuringSend()
    {
        ArchitectureDigest digest = CreateDigest();
        DigestSubscription original = new()
        {
            TenantId = digest.TenantId,
            WorkspaceId = digest.WorkspaceId,
            ProjectId = digest.ProjectId,
            ChannelType = DigestDeliveryChannelType.Email,
            Destination = "old@example.com",
        };
        DigestSubscription updated = new()
        {
            SubscriptionId = original.SubscriptionId,
            TenantId = original.TenantId,
            WorkspaceId = original.WorkspaceId,
            ProjectId = original.ProjectId,
            ChannelType = original.ChannelType,
            Destination = "new@example.com",
            IsEnabled = false,
        };
        InMemoryDigestSubscriptionRepository subscriptions = new();
        await subscriptions.CreateAsync(original, CancellationToken.None);
        Mock<IDigestDeliveryChannel> channel = new();
        channel.Setup(x => x.ChannelType).Returns(DigestDeliveryChannelType.Email);
        channel.Setup(x => x.SendAsync(It.IsAny<DigestDeliveryPayload>(), It.IsAny<CancellationToken>()))
            .Returns((DigestDeliveryPayload _, CancellationToken ct) => subscriptions.UpdateAsync(updated, ct));
        DigestDeliveryDispatcher sut = CreateSut([channel.Object], subscriptions,
            new InMemoryDigestDeliveryAttemptRepository(), Mock.Of<IAuditService>());

        await sut.DeliverAsync(digest, CancellationToken.None);

        ScopeContext scope = new()
        {
            TenantId = original.TenantId,
            WorkspaceId = original.WorkspaceId,
            ProjectId = original.ProjectId,
        };
        DigestSubscription? stored =
            await subscriptions.GetByIdAsync(scope, original.SubscriptionId, CancellationToken.None);
        stored.Should().NotBeNull();
        stored!.IsEnabled.Should().BeFalse();
        stored.Destination.Should().Be(updated.Destination);
        stored.LastDeliveredUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task DeliverAsync_WhenSuccessAuditFails_PreservesSuccessfulDelivery()
    {
        ArchitectureDigest digest = CreateDigest();
        InMemoryDigestSubscriptionRepository subscriptions = new();
        await subscriptions.CreateAsync(new DigestSubscription
        {
            TenantId = digest.TenantId,
            WorkspaceId = digest.WorkspaceId,
            ProjectId = digest.ProjectId,
            ChannelType = DigestDeliveryChannelType.Email,
            Destination = "ops@example.com",
        }, CancellationToken.None);
        InMemoryDigestDeliveryAttemptRepository attempts = new();
        Mock<IDigestDeliveryChannel> channel = new();
        channel.Setup(x => x.ChannelType).Returns(DigestDeliveryChannelType.Email);
        channel.Setup(x => x.SendAsync(It.IsAny<DigestDeliveryPayload>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        Mock<IAuditService> audit = new();
        audit.Setup(x => x.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.DigestDeliverySucceeded),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit storage unavailable"));
        DigestDeliveryDispatcher sut = CreateSut([channel.Object], subscriptions, attempts, audit.Object);

        await sut.DeliverAsync(digest, CancellationToken.None);

        ScopeContext scope = new()
        {
            TenantId = digest.TenantId,
            WorkspaceId = digest.WorkspaceId,
            ProjectId = digest.ProjectId,
        };
        IReadOnlyList<DigestDeliveryAttempt> history =
            await attempts.ListByDigestAsync(scope, digest.DigestId, CancellationToken.None);
        history.Should().ContainSingle().Which.Status.Should().Be(DigestDeliveryStatus.Succeeded);
        audit.Verify(x => x.LogAsync(
            It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.DigestDeliveryFailed),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeliverAsync_WhenChannelFails_AuditsFailureWithoutThrowing()
    {
        DigestSubscription subscription = new()
        {
            SubscriptionId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            ChannelType = DigestDeliveryChannelType.Email,
            Destination = "bad",
        };

        Mock<IDigestSubscriptionRepository> subscriptions = new();
        subscriptions
            .Setup(x => x.ListEnabledByScopeAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([subscription]);

        Mock<IDigestDeliveryAttemptRepository> attempts = new();
        attempts
            .Setup(x => x.CreateAsync(It.IsAny<DigestDeliveryAttempt>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        attempts
            .Setup(x => x.UpdateAsync(It.IsAny<DigestDeliveryAttempt>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IDigestDeliveryChannel> channel = new();
        channel.Setup(x => x.ChannelType).Returns(DigestDeliveryChannelType.Email);
        channel
            .Setup(x => x.SendAsync(It.IsAny<DigestDeliveryPayload>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("send failed"));

        Mock<IAuditService> audit = new();
        audit
            .Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        DigestDeliveryDispatcher sut = CreateSut(
            [channel.Object],
            subscriptions.Object,
            attempts.Object,
            audit.Object);

        ArchitectureDigest digest = CreateDigest();

        await sut.Invoking(x => x.DeliverAsync(digest, CancellationToken.None)).Should().NotThrowAsync();

        audit.Verify(
            x => x.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.DigestDeliveryFailed),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static DigestDeliveryDispatcher CreateSut(
        IEnumerable<IDigestDeliveryChannel> channels,
        IDigestSubscriptionRepository subscriptionRepository,
        IDigestDeliveryAttemptRepository attemptRepository,
        IAuditService auditService) =>
        new(channels, subscriptionRepository, attemptRepository, auditService);

    private static ArchitectureDigest CreateDigest() =>
        new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            Title = "t",
            Summary = "s",
            ContentMarkdown = "m",
            MetadataJson = """{"manifestHash":"unit-test-manifest-hash"}""",
        };
}
