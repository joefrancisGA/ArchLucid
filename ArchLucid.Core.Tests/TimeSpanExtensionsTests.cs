using FluentAssertions;

namespace ArchLucid.Core.Tests;

[Trait("Category", "Unit")]
public sealed class TimeSpanExtensionsTests
{
    [Fact]
    public void Clamp_below_min_returns_min()
    {
        TimeSpan min = TimeSpan.FromMilliseconds(50);
        TimeSpan max = TimeSpan.FromMinutes(2);

        TimeSpan.Zero.Clamp(min, max).Should().Be(min);
    }

    [Fact]
    public void Clamp_above_max_returns_max()
    {
        TimeSpan min = TimeSpan.FromMilliseconds(50);
        TimeSpan max = TimeSpan.FromMinutes(2);

        TimeSpan.FromHours(9).Clamp(min, max).Should().Be(max);
    }

    [Fact]
    public void Clamp_in_range_returns_value()
    {
        TimeSpan min = TimeSpan.FromMilliseconds(50);
        TimeSpan max = TimeSpan.FromMinutes(2);
        TimeSpan mid = TimeSpan.FromSeconds(12);

        mid.Clamp(min, max).Should().Be(mid);
    }

    [Fact]
    public void Clamp_min_equals_max_returns_that_bound()
    {
        TimeSpan both = TimeSpan.FromSeconds(3);

        TimeSpan.FromSeconds(1).Clamp(both, both).Should().Be(both);
        TimeSpan.FromMinutes(1).Clamp(both, both).Should().Be(both);
    }

    [Fact]
    public void Clamp_throws_when_min_greater_than_max()
    {
        TimeSpan min = TimeSpan.FromMinutes(2);
        TimeSpan max = TimeSpan.FromSeconds(1);

        Action act = () => TimeSpan.FromSeconds(30).Clamp(min, max);

        act.Should().Throw<ArgumentException>().WithParameterName("min");
    }
}
