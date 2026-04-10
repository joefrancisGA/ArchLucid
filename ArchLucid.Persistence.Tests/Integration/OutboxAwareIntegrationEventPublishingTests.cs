using System.Data;

using ArchLucid.Core.Integration;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Persistence.Tests.Integration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class OutboxAwareIntegrationEventPublishingTests
{
    [Fact]
    public async Task TryPublishOrEnqueueAsync_when_outbox_enabled_and_tx_enqueues_and_skips_direct_publish()
    {
        Mock<IIntegrationEventOutboxRepository> outbox = new();
        Mock<IIntegrationEventPublisher> publisher = new();
        Mock<IDbConnection> connection = new();
        Mock<IDbTransaction> transaction = new();
        IntegrationEventsOptions options = new()
        {
            TransactionalOutboxEnabled = true
        };
        object payload = new
        {
            schemaVersion = 1,
            x = 1
        };

        await OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
            outbox.Object,
            publisher.Object,
            options,
            NullLogger.Instance,
            IntegrationEventTypes.AlertFiredV1,
            payload,
            messageId: "mid",
            runId: Guid.NewGuid(),
            tenantId: Guid.NewGuid(),
            workspaceId: Guid.NewGuid(),
            projectId: Guid.NewGuid(),
            connection.Object,
            transaction.Object,
            CancellationToken.None);

        outbox.Verify(
            o => o.EnqueueAsync(
                It.IsAny<Guid?>(),
                IntegrationEventTypes.AlertFiredV1,
                "mid",
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                connection.Object,
                transaction.Object,
                It.IsAny<CancellationToken>()),
            Times.Once);

        publisher.Verify(
            p => p.PublishAsync(It.IsAny<string>(), It.IsAny<ReadOnlyMemory<byte>>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryPublishOrEnqueueAsync_when_outbox_enabled_without_tx_enqueues_standalone()
    {
        Mock<IIntegrationEventOutboxRepository> outbox = new();
        Mock<IIntegrationEventPublisher> publisher = new();
        IntegrationEventsOptions options = new()
        {
            TransactionalOutboxEnabled = true
        };

        await OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
            outbox.Object,
            publisher.Object,
            options,
            NullLogger.Instance,
            IntegrationEventTypes.AlertResolvedV1,
            new
            {
                a = 1
            },
            null,
            null,
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            connection: null,
            transaction: null,
            CancellationToken.None);

        outbox.Verify(
            o => o.EnqueueAsync(
                It.IsAny<Guid?>(),
                IntegrationEventTypes.AlertResolvedV1,
                It.IsAny<string?>(),
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Once);

        publisher.Verify(
            p => p.PublishAsync(It.IsAny<string>(), It.IsAny<ReadOnlyMemory<byte>>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryPublishOrEnqueueAsync_when_outbox_disabled_uses_direct_publish()
    {
        Mock<IIntegrationEventOutboxRepository> outbox = new();
        Mock<IIntegrationEventPublisher> publisher = new();
        publisher
            .Setup(p => p.PublishAsync(It.IsAny<string>(), It.IsAny<ReadOnlyMemory<byte>>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        IntegrationEventsOptions options = new()
        {
            TransactionalOutboxEnabled = false
        };

        await OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
            outbox.Object,
            publisher.Object,
            options,
            NullLogger.Instance,
            IntegrationEventTypes.AdvisoryScanCompletedV1,
            new
            {
                schemaVersion = 1
            },
            "z",
            null,
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Mock.Of<IDbConnection>(),
            Mock.Of<IDbTransaction>(),
            CancellationToken.None);

        outbox.Verify(
            o => o.EnqueueAsync(
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);

        publisher.Verify(
            p => p.PublishAsync(
                IntegrationEventTypes.AdvisoryScanCompletedV1,
                It.IsAny<ReadOnlyMemory<byte>>(),
                "z",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TryPublishOrEnqueueAsync_when_enqueue_throws_does_not_throw_to_caller()
    {
        Mock<IIntegrationEventOutboxRepository> outbox = new();
        outbox
            .Setup(
                o => o.EnqueueAsync(
                    It.IsAny<Guid?>(),
                    It.IsAny<string>(),
                    It.IsAny<string?>(),
                    It.IsAny<ReadOnlyMemory<byte>>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("sql down"));

        Mock<IIntegrationEventPublisher> publisher = new();

        Func<Task> act = async () => await OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
            outbox.Object,
            publisher.Object,
            new IntegrationEventsOptions { TransactionalOutboxEnabled = true },
            NullLogger.Instance,
            IntegrationEventTypes.GovernanceApprovalSubmittedV1,
            new
            {
                schemaVersion = 1
            },
            null,
            null,
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            null,
            CancellationToken.None);

        await act.Should().NotThrowAsync();
    }
}
