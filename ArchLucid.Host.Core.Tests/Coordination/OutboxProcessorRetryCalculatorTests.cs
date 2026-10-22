using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Coordination;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class OutboxProcessorRetryCalculatorTests
{
    [Theory]
    [InlineData(0, 3, false)]
    [InlineData(1, 3, false)]
    [InlineData(2, 3, true)]
    [InlineData(46, 48, false)]
    [InlineData(47, 48, true)]
    public void Retries_exhausted_matches_attempt_threshold(int attemptCount, int maxAttempts, bool expected)
    {
        OutboxProcessorRetryCalculator.RetriesExhaustedAfterThisFailure(attemptCount, maxAttempts)
            .Should()
            .Be(expected);
    }

    [Fact]
    public void Retry_delay_grows_exponentially_with_cap()
    {
        TestOptions opts = new() { RetryBackoffBaseSeconds = 10, RetryBackoffMaxSeconds = 40 };

        OutboxProcessorRetryCalculator.RetryDelayAfterFailure(0, opts).Should().Be(TimeSpan.FromSeconds(10));
        OutboxProcessorRetryCalculator.RetryDelayAfterFailure(1, opts).Should().Be(TimeSpan.FromSeconds(20));
        OutboxProcessorRetryCalculator.RetryDelayAfterFailure(2, opts).Should().Be(TimeSpan.FromSeconds(40));
        OutboxProcessorRetryCalculator.RetryDelayAfterFailure(5, opts).Should().Be(TimeSpan.FromSeconds(40));
    }

    private sealed class TestOptions : IOutboxLeaseRetryProcessorOptions
    {
        public int LeaseDurationSeconds { get; init; } = 300;

        public int MaxAttemptsBeforeDeadLetter { get; init; } = 48;

        public int RetryBackoffBaseSeconds { get; init; } = 10;

        public int RetryBackoffMaxSeconds { get; init; } = 900;
    }
}
