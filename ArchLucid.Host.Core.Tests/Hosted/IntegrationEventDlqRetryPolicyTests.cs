using ArchLucid.Host.Core.Hosted;
using ArchLucid.Persistence.IntegrationOutbox;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Hosted;

[Trait("Category", "Unit")]
public sealed class IntegrationEventDlqRetryPolicyTests
{
    [Theory]
    [InlineData(0, 1)]
    [InlineData(1, 2)]
    [InlineData(3, 8)]
    public void ComputeBackoff_uses_exponential_minutes(int retryCount, double expectedMinutes)
    {
        TimeSpan backoff = IntegrationEventDlqRetryPolicy.ComputeBackoff(retryCount);

        backoff.TotalMinutes.Should().Be(expectedMinutes);
    }

    [Fact]
    public void IsEligibleForAutoRetry_false_when_retry_count_at_max()
    {
        IntegrationEventOutboxDeadLetterRow row = CreateRow(retryCount: IntegrationEventDlqRetryPolicy.MaxAutoRetryCount);

        IntegrationEventDlqRetryPolicy
            .IsEligibleForAutoRetry(row, DateTime.UtcNow.AddHours(1))
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsEligibleForAutoRetry_false_before_backoff_elapses()
    {
        DateTime deadLetteredUtc = new(2026, 5, 26, 12, 0, 0, DateTimeKind.Utc);
        IntegrationEventOutboxDeadLetterRow row = CreateRow(retryCount: 2, deadLetteredUtc: deadLetteredUtc);

        IntegrationEventDlqRetryPolicy
            .IsEligibleForAutoRetry(row, deadLetteredUtc.AddMinutes(3))
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsEligibleForAutoRetry_true_after_backoff_elapses()
    {
        DateTime deadLetteredUtc = new(2026, 5, 26, 12, 0, 0, DateTimeKind.Utc);
        IntegrationEventOutboxDeadLetterRow row = CreateRow(retryCount: 2, deadLetteredUtc: deadLetteredUtc);

        IntegrationEventDlqRetryPolicy
            .IsEligibleForAutoRetry(row, deadLetteredUtc.AddMinutes(5))
            .Should()
            .BeTrue();
    }

    private static IntegrationEventOutboxDeadLetterRow CreateRow(int retryCount, DateTime? deadLetteredUtc = null)
    {
        return new IntegrationEventOutboxDeadLetterRow
        {
            OutboxId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            EventType = "Test.Event",
            DeadLetteredUtc = deadLetteredUtc ?? DateTime.UtcNow,
            RetryCount = retryCount,
        };
    }
}
