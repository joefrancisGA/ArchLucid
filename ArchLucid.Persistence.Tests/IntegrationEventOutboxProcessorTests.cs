using ArchLucid.Core.Integration;
using ArchLucid.Persistence.IntegrationOutbox;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests;

[Trait("Suite", "Core")]
public sealed class IntegrationEventOutboxProcessorTests
{
    [SkippableFact]
    public async Task ProcessPendingBatchAsync_processes_multiple_entries_in_one_batch()
    {
        Mock<IIntegrationEventPublisher> publisher = new();
        publisher
            .Setup(p => p.PublishAsync(It.IsAny<string>(), It.IsAny<ReadOnlyMemory<byte>>(), It.IsAny<string?>(),
                It.IsAny<IReadOnlyDictionary<string, object>?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IIntegrationEventOutboxRepository> outbox = new();
        Guid id1 = Guid.NewGuid();
        Guid id2 = Guid.NewGuid();

        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new IntegrationEventOutboxEntry
                {
                    OutboxId = id1,
                    RunId = Guid.NewGuid(),
                    EventType = "t1",
                    MessageId = null,
                    PayloadUtf8 = [1],
                    TenantId = Guid.NewGuid(),
                    WorkspaceId = Guid.NewGuid(),
                    ProjectId = Guid.NewGuid(),
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    RetryCount = 0
                },
                new IntegrationEventOutboxEntry
                {
                    OutboxId = id2,
                    RunId = Guid.NewGuid(),
                    EventType = "t2",
                    MessageId = null,
                    PayloadUtf8 = [2],
                    TenantId = Guid.NewGuid(),
                    WorkspaceId = Guid.NewGuid(),
                    ProjectId = Guid.NewGuid(),
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    RetryCount = 0
                }
            ]);

        IntegrationEventOutboxProcessor sut = CreateProcessor(outbox.Object, publisher.Object);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(o => o.MarkProcessedAsync(id1, It.IsAny<CancellationToken>()), Times.Once);
        outbox.Verify(o => o.MarkProcessedAsync(id2, It.IsAny<CancellationToken>()), Times.Once);
        publisher.Verify(
            p => p.PublishAsync(It.IsAny<string>(), It.IsAny<ReadOnlyMemory<byte>>(), It.IsAny<string?>(),
                It.IsAny<IReadOnlyDictionary<string, object>?>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [SkippableFact]
    public async Task ProcessPendingBatchAsync_on_success_marks_processed()
    {
        Mock<IIntegrationEventPublisher> publisher = new();
        publisher
            .Setup(p => p.PublishAsync(It.IsAny<string>(), It.IsAny<ReadOnlyMemory<byte>>(), It.IsAny<string?>(),
                It.IsAny<IReadOnlyDictionary<string, object>?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IIntegrationEventOutboxRepository> outbox = new();
        Guid id = Guid.NewGuid();

        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new IntegrationEventOutboxEntry
                {
                    OutboxId = id,
                    RunId = Guid.NewGuid(),
                    EventType = "t",
                    MessageId = null,
                    PayloadUtf8 = [1],
                    TenantId = Guid.NewGuid(),
                    WorkspaceId = Guid.NewGuid(),
                    ProjectId = Guid.NewGuid(),
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    RetryCount = 0
                }
            ]);

        IntegrationEventOutboxProcessor sut = CreateProcessor(outbox.Object, publisher.Object);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(o => o.MarkProcessedAsync(id, It.IsAny<CancellationToken>()), Times.Once);
        outbox.Verify(
            o => o.RecordPublishFailureAsync(
                It.IsAny<Guid>(),
                It.IsAny<int>(),
                It.IsAny<DateTime?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ProcessPendingBatchAsync_on_failure_schedules_retry_when_under_cap()
    {
        Mock<IIntegrationEventPublisher> publisher = new();
        publisher
            .Setup(p => p.PublishAsync(It.IsAny<string>(), It.IsAny<ReadOnlyMemory<byte>>(), It.IsAny<string?>(),
                It.IsAny<IReadOnlyDictionary<string, object>?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("sb down"));

        Mock<IIntegrationEventOutboxRepository> outbox = new();
        Guid id = Guid.NewGuid();

        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new IntegrationEventOutboxEntry
                {
                    OutboxId = id,
                    RunId = Guid.NewGuid(),
                    EventType = "t",
                    MessageId = null,
                    PayloadUtf8 = [1],
                    TenantId = Guid.NewGuid(),
                    WorkspaceId = Guid.NewGuid(),
                    ProjectId = Guid.NewGuid(),
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    RetryCount = 0
                }
            ]);

        IntegrationEventsOptions opts = new()
        {
            OutboxMaxPublishAttempts = 6,
            OutboxMaxBackoffSeconds = 300
        };
        IntegrationEventOutboxProcessor sut = CreateProcessor(outbox.Object, publisher.Object, opts);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(o => o.MarkProcessedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        outbox.Verify(
            o => o.RecordPublishFailureAsync(
                id,
                1,
                It.Is<DateTime?>(n => n.HasValue),
                null,
                It.Is<string>(s => s.Contains("sb down", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task ProcessPendingBatchAsync_on_failure_dead_letters_when_at_cap()
    {
        Mock<IIntegrationEventPublisher> publisher = new();
        publisher
            .Setup(p => p.PublishAsync(It.IsAny<string>(), It.IsAny<ReadOnlyMemory<byte>>(), It.IsAny<string?>(),
                It.IsAny<IReadOnlyDictionary<string, object>?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("fail"));

        Mock<IIntegrationEventOutboxRepository> outbox = new();
        Guid id = Guid.NewGuid();

        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new IntegrationEventOutboxEntry
                {
                    OutboxId = id,
                    RunId = Guid.NewGuid(),
                    EventType = "t",
                    MessageId = null,
                    PayloadUtf8 = [1],
                    TenantId = Guid.NewGuid(),
                    WorkspaceId = Guid.NewGuid(),
                    ProjectId = Guid.NewGuid(),
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    RetryCount = 5
                }
            ]);

        IntegrationEventsOptions opts = new()
        {
            OutboxMaxPublishAttempts = 6,
            OutboxMaxBackoffSeconds = 300
        };
        IntegrationEventOutboxProcessor sut = CreateProcessor(outbox.Object, publisher.Object, opts);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(
            o => o.RecordPublishFailureAsync(
                id,
                6,
                null,
                It.Is<DateTime?>(d => d.HasValue),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task ProcessPendingBatchAsync_on_failure_truncates_error_message_to_2048_chars()
    {
        string huge = new('x', 3000);
        Mock<IIntegrationEventPublisher> publisher = new();
        publisher
            .Setup(p => p.PublishAsync(It.IsAny<string>(), It.IsAny<ReadOnlyMemory<byte>>(), It.IsAny<string?>(),
                It.IsAny<IReadOnlyDictionary<string, object>?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException(huge));

        Mock<IIntegrationEventOutboxRepository> outbox = new();
        Guid id = Guid.NewGuid();

        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new IntegrationEventOutboxEntry
                {
                    OutboxId = id,
                    RunId = null,
                    EventType = "t",
                    MessageId = null,
                    PayloadUtf8 = [1],
                    TenantId = Guid.NewGuid(),
                    WorkspaceId = Guid.NewGuid(),
                    ProjectId = Guid.NewGuid(),
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    RetryCount = 0
                }
            ]);

        IntegrationEventsOptions opts = new()
        {
            OutboxMaxPublishAttempts = 2,
            OutboxMaxBackoffSeconds = 60
        };
        IntegrationEventOutboxProcessor sut = CreateProcessor(outbox.Object, publisher.Object, opts);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(
            o => o.RecordPublishFailureAsync(
                id,
                1,
                It.IsAny<DateTime?>(),
                null,
                It.Is<string>(s => s.Length == 2048),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task ProcessPendingBatchAsync_redrain_after_publish_without_mark_republishes_identical_MessageId()
    {
        const string messageId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890:com.archlucid.test.event";
        Guid outboxId = Guid.NewGuid();
        IntegrationEventOutboxEntry entry = new()
        {
            OutboxId = outboxId,
            RunId = Guid.NewGuid(),
            EventType = "com.archlucid.test.event",
            MessageId = messageId,
            PayloadUtf8 = [1],
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            RetryCount = 0
        };

        int dequeueCalls = 0;
        Mock<IIntegrationEventOutboxRepository> outbox = new();
        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                dequeueCalls++;

                if (dequeueCalls <= 2)
                    return new[] { entry };

                return Array.Empty<IntegrationEventOutboxEntry>();
            });

        outbox
            .Setup(o => o.MarkProcessedAsync(outboxId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        List<string?> publishedMessageIds = [];
        Mock<IIntegrationEventPublisher> publisher = new();
        publisher
            .Setup(p => p.PublishAsync(
                It.IsAny<string>(),
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.IsAny<string?>(),
                It.IsAny<IReadOnlyDictionary<string, object>?>(),
                It.IsAny<CancellationToken>()))
            .Callback<string, ReadOnlyMemory<byte>, string?, IReadOnlyDictionary<string, object>?, CancellationToken>(
                (_, _, mid, _, _) => publishedMessageIds.Add(mid))
            .Returns(Task.CompletedTask);

        IntegrationEventOutboxProcessor sut = CreateProcessor(outbox.Object, publisher.Object);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);
        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        publishedMessageIds.Should().HaveCount(2);
        publishedMessageIds.Should().AllBeEquivalentTo(messageId);
        outbox.Verify(o => o.MarkProcessedAsync(outboxId, It.IsAny<CancellationToken>()), Times.Exactly(2));
        publisher.Verify(
            p => p.PublishAsync(
                entry.EventType,
                entry.PayloadUtf8,
                messageId,
                It.IsAny<IReadOnlyDictionary<string, object>?>(),
                It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [SkippableFact]
    public async Task ProcessPendingBatchAsync_respects_outbox_max_concurrent_batch_entries()
    {
        int inFlight = 0;
        int peak = 0;
        object sync = new();

        Mock<IIntegrationEventPublisher> publisher = new();
        publisher
            .Setup(p => p.PublishAsync(It.IsAny<string>(), It.IsAny<ReadOnlyMemory<byte>>(), It.IsAny<string?>(),
                It.IsAny<IReadOnlyDictionary<string, object>?>(), It.IsAny<CancellationToken>()))
            .Returns(async () =>
            {
                lock (sync)
                {
                    inFlight++;

                    if (inFlight > peak)
                        peak = inFlight;
                }

                await Task.Delay(50);

                lock (sync)
                    inFlight--;
            });

        Mock<IIntegrationEventOutboxRepository> outbox = new();
        List<IntegrationEventOutboxEntry> entries = Enumerable.Range(0, 6)
            .Select(_ => new IntegrationEventOutboxEntry
            {
                OutboxId = Guid.NewGuid(),
                RunId = Guid.NewGuid(),
                EventType = "t",
                MessageId = null,
                PayloadUtf8 = [1],
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                RetryCount = 0
            })
            .ToList();

        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entries);

        IntegrationEventsOptions opts = new()
        {
            OutboxMaxConcurrentBatchEntries = 2,
        };

        IntegrationEventOutboxProcessor sut = CreateProcessor(outbox.Object, publisher.Object, opts);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        peak.Should().BeLessOrEqualTo(2);
        peak.Should().BeGreaterOrEqualTo(2);
        outbox.Verify(o => o.MarkProcessedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Exactly(entries.Count));
    }

    private static IntegrationEventOutboxProcessor CreateProcessor(
        IIntegrationEventOutboxRepository outbox,
        IIntegrationEventPublisher publisher,
        IntegrationEventsOptions? options = null)
    {
        ServiceCollection services = [];
        services.AddScoped(_ => outbox);
        services.AddScoped(_ => publisher);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory factory = provider.GetRequiredService<IServiceScopeFactory>();
        IOptions<IntegrationEventsOptions> opt =
            Microsoft.Extensions.Options.Options.Create(options ?? new IntegrationEventsOptions());

        return new IntegrationEventOutboxProcessor(factory, opt, NullLogger<IntegrationEventOutboxProcessor>.Instance);
    }
}
