using ArchiForge.Core.Integration;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchiForge.Core.Tests.Integration;

[Trait("Category", "Unit")]
public sealed class IntegrationEventPublishingTests
{
    [Fact]
    public async Task TryPublishAsync_OnPublisherException_LogsAndDoesNotThrow()
    {
        Mock<IIntegrationEventPublisher> publisher = new();
        publisher
            .Setup(
                p => p.PublishAsync(
                    It.IsAny<string>(),
                    It.IsAny<ReadOnlyMemory<byte>>(),
                    It.IsAny<string?>(),
                    It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("bus down"));

        Func<Task> act = async () =>
            await IntegrationEventPublishing.TryPublishAsync(
                publisher.Object,
                NullLogger.Instance,
                IntegrationEventTypes.AlertFiredV1,
                new { schemaVersion = 1, alertId = Guid.Empty },
                "mid",
                CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task TryPublishAsync_WhenSuccessful_CallsPublisherOnce()
    {
        Mock<IIntegrationEventPublisher> publisher = new();
        publisher
            .Setup(
                p => p.PublishAsync(
                    It.IsAny<string>(),
                    It.IsAny<ReadOnlyMemory<byte>>(),
                    It.IsAny<string?>(),
                    It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        await IntegrationEventPublishing.TryPublishAsync(
            publisher.Object,
            NullLogger.Instance,
            IntegrationEventTypes.AlertResolvedV1,
            new { schemaVersion = 1 },
            "x",
            CancellationToken.None);

        publisher.Verify(
            p => p.PublishAsync(
                IntegrationEventTypes.AlertResolvedV1,
                It.IsAny<ReadOnlyMemory<byte>>(),
                "x",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
