using ArchLucid.Persistence.IntegrationOutbox;

namespace ArchLucid.Persistence.Tests;
[Trait("Category", "Unit")]

public sealed class IntegrationEventOutboxRetryCalculatorTests
{
    [SkippableFact]
    public void DelayUntilNextAttempt_first_failure_uses_two_seconds()
    {
        TimeSpan d = IntegrationEventOutboxRetryCalculator.DelayUntilNextAttempt(1, 300);

        d.Should().Be(TimeSpan.FromSeconds(2));
    }

    [SkippableFact]
    public void DelayUntilNextAttempt_respects_cap()
    {
        TimeSpan d = IntegrationEventOutboxRetryCalculator.DelayUntilNextAttempt(20, 30);

        d.Should().Be(TimeSpan.FromSeconds(30));
    }

    [Theory]
    [InlineData(2, 300, 4)]
    [InlineData(3, 300, 8)]
    [InlineData(5, 300, 32)]
    [InlineData(8, 100, 100)]
    [InlineData(1, 0, 1)]
    [InlineData(30, 100000, 86400)]
    public void DelayUntilNextAttempt_uses_exponential_growth_and_bounded_cap(int failures, int cap, int seconds)
    {
        IntegrationEventOutboxRetryCalculator.DelayUntilNextAttempt(failures, cap)
            .Should().Be(TimeSpan.FromSeconds(seconds));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void DelayUntilNextAttempt_rejects_non_positive(int n)
    {
        Action act = () => IntegrationEventOutboxRetryCalculator.DelayUntilNextAttempt(n, 10);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }
}
