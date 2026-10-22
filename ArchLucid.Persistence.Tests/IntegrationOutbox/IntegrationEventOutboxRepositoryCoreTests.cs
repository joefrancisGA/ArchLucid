using ArchLucid.Persistence.IntegrationOutbox;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.IntegrationOutbox;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class IntegrationEventOutboxRepositoryCoreTests
{
    [Fact]
    public void ClampDequeueBatch_clamps() =>
        IntegrationEventOutboxRepositoryCore.ClampDequeueBatch(500).Should().Be(100);

    [Fact]
    public void OrderPendingForDequeue_prefers_priority_then_created_utc()
    {
        DateTime utcNow = new(2026, 1, 2, 12, 0, 0, DateTimeKind.Utc);
        IntegrationEventOutboxEntry lowPriority = CreateEntry(priority: 2, createdUtc: utcNow.AddMinutes(-5));
        IntegrationEventOutboxEntry highPriority = CreateEntry(priority: 0, createdUtc: utcNow);

        List<IntegrationEventOutboxEntry> ordered = IntegrationEventOutboxRepositoryCore
            .OrderPendingForDequeue([lowPriority, highPriority], utcNow)
            .ToList();

        ordered.Should().ContainInOrder(highPriority, lowPriority);
    }

    [Fact]
    public void WithPublishFailure_truncates_error_message()
    {
        IntegrationEventOutboxEntry entry = CreateEntry();
        string longError = new('x', IntegrationEventOutboxRepositoryCore.MaxErrorMessageLength + 10);

        IntegrationEventOutboxEntry updated = IntegrationEventOutboxRepositoryCore.WithPublishFailure(
            entry,
            newRetryCount: 1,
            nextRetryUtc: DateTime.UtcNow.AddMinutes(1),
            deadLetteredUtc: null,
            lastErrorMessage: longError);

        updated.LastErrorMessage.Should().HaveLength(IntegrationEventOutboxRepositoryCore.MaxErrorMessageLength);
    }

    [Fact]
    public void ResetDeadLetterForRetry_clears_dead_letter_state()
    {
        IntegrationEventOutboxEntry deadLetter = CreateEntry(deadLetteredUtc: DateTime.UtcNow, retryCount: 3);

        IntegrationEventOutboxEntry reset = IntegrationEventOutboxRepositoryCore.ResetDeadLetterForRetry(deadLetter);

        reset.DeadLetteredUtc.Should().BeNull();
        reset.RetryCount.Should().Be(0);
        reset.LastErrorMessage.Should().BeNull();
    }

    private static IntegrationEventOutboxEntry CreateEntry(
        int priority = 1,
        DateTime? createdUtc = null,
        DateTime? deadLetteredUtc = null,
        int retryCount = 0) =>
        new()
        {
            OutboxId = Guid.NewGuid(),
            EventType = "RunCompleted",
            PayloadUtf8 = [1, 2, 3],
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            CreatedUtc = createdUtc ?? DateTime.UtcNow,
            Priority = priority,
            RetryCount = retryCount,
            DeadLetteredUtc = deadLetteredUtc,
        };
}
