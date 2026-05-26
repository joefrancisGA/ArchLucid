using ArchLucid.Persistence.Connections;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Connections;

[Trait("Category", "Unit")]
public sealed class SqlOpenRetryDelayCalculatorTests
{
    [Theory]
    [InlineData(1, 200, 0, 200)]
    [InlineData(2, 200, 0, 400)]
    [InlineData(3, 200, 40, 840)]
    public void Calculate_applies_exponential_backoff_plus_jitter_offset(
        int attemptNumber,
        int baseDelayMs,
        int jitterOffsetMs,
        double expectedMs)
    {
        TimeSpan result = SqlOpenRetryDelayCalculator.Calculate(
            attemptNumber,
            TimeSpan.FromMilliseconds(baseDelayMs),
            jitterOffsetMs);

        result.TotalMilliseconds.Should().Be(expectedMs);
    }

    [Fact]
    public void ComputeJitterSpanMilliseconds_uses_twenty_percent_fraction()
    {
        SqlOpenRetryDelayCalculator.ComputeJitterSpanMilliseconds(200).Should().Be(40);
        SqlOpenRetryDelayCalculator.ComputeJitterSpanMilliseconds(400).Should().Be(80);
    }

    [Fact]
    public void Calculate_clamps_negative_jitter_to_zero_total_delay()
    {
        TimeSpan result = SqlOpenRetryDelayCalculator.Calculate(
            1,
            TimeSpan.FromMilliseconds(10),
            -100);

        result.TotalMilliseconds.Should().Be(0);
    }
}
