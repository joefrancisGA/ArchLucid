using ArchLucid.Core.Persistence.ApplicationPorts.Coordination;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Coordination;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RecoverableOutboxFailureHandlerTests
{
    [Fact]
    public async Task HandleAsync_does_not_escape_dead_letter_hook_failure_after_recording_terminal_state()
    {
        FakeEntry entry = new() { OutboxId = Guid.NewGuid(), AttemptCount = 3 };
        FakeRepository repository = new();
        bool hookCalled = false;

        Func<Task> onDeadLetter = () =>
        {
            hookCalled = true;
            throw new InvalidOperationException("audit sink unavailable");
        };

        Func<Task> action = () => RecoverableOutboxFailureHandler.HandleAsync(
            repository,
            entry,
            new InvalidOperationException("processing failed"),
            "processing failed",
            new TestOptions { MaxAttemptsBeforeDeadLetter = 3 },
            TimeProvider.System,
            onDeadLetter,
            static () => Task.CompletedTask,
            CancellationToken.None);

        await action.Should().NotThrowAsync();
        hookCalled.Should().BeTrue();
        repository.DeadLetteredId.Should().Be(entry.OutboxId);
    }

    [Fact]
    public async Task HandleAsync_does_not_escape_retry_hook_failure_after_recording_backoff()
    {
        FakeEntry entry = new() { OutboxId = Guid.NewGuid(), AttemptCount = 0 };
        FakeRepository repository = new();
        bool hookCalled = false;

        Func<Task> onRetryScheduled = () =>
        {
            hookCalled = true;
            throw new InvalidOperationException("metrics sink unavailable");
        };

        Func<Task> action = () => RecoverableOutboxFailureHandler.HandleAsync(
            repository,
            entry,
            new InvalidOperationException("processing failed"),
            "processing failed",
            new TestOptions { MaxAttemptsBeforeDeadLetter = 3 },
            TimeProvider.System,
            static () => Task.CompletedTask,
            onRetryScheduled,
            CancellationToken.None);

        await action.Should().NotThrowAsync();
        hookCalled.Should().BeTrue();
        repository.BackoffRecordedId.Should().Be(entry.OutboxId);
    }

    private sealed class FakeEntry : IRecoverableOutboxEntry
    {
        public Guid OutboxId { get; init; }

        public int AttemptCount { get; init; }
    }

    private sealed class FakeRepository : IRecoverableOutboxRepository<FakeEntry>
    {
        public Guid? DeadLetteredId { get; private set; }

        public Guid? BackoffRecordedId { get; private set; }

        public Task<IReadOnlyList<FakeEntry>> DequeuePendingAsync(
            int maxBatch,
            int leaseDurationSeconds,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<FakeEntry>>([]);

        public Task MarkProcessedAsync(Guid outboxId, CancellationToken cancellationToken) =>
            Task.CompletedTask;

        public Task RecordBackoffAfterProcessingFailureAsync(
            Guid outboxId,
            DateTime nextAttemptUtc,
            string failedAttemptErrorSummaryTruncatedTo400,
            CancellationToken cancellationToken)
        {
            BackoffRecordedId = outboxId;
            return Task.CompletedTask;
        }

        public Task RecordDeadLetterAsync(
            Guid outboxId,
            string failedAttemptErrorSummaryTruncatedTo400,
            CancellationToken cancellationToken)
        {
            DeadLetteredId = outboxId;
            return Task.CompletedTask;
        }
    }

    private sealed class TestOptions : IOutboxLeaseRetryProcessorOptions
    {
        public int LeaseDurationSeconds { get; init; } = 300;

        public int MaxAttemptsBeforeDeadLetter { get; init; } = 48;

        public int RetryBackoffBaseSeconds { get; init; } = 10;

        public int RetryBackoffMaxSeconds { get; init; } = 900;
    }
}
