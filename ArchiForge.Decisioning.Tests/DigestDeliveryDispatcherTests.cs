using ArchiForge.Core.Audit;
using ArchiForge.Decisioning.Advisory.Delivery;
using ArchiForge.Decisioning.Advisory.Scheduling;
using ArchiForge.Persistence.Advisory;

using FluentAssertions;

using Moq;

namespace ArchiForge.Decisioning.Tests;

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
            .Setup(x => x.UpdateAsync(It.IsAny<DigestSubscription>(), It.IsAny<CancellationToken>()))
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
        subscriptions.Verify(x => x.UpdateAsync(It.IsAny<DigestSubscription>(), It.IsAny<CancellationToken>()), Times.Once);
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
        };
}
