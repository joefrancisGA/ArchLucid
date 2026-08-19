using FluentAssertions;

namespace ArchLucid.Core.Tests;

[Trait("Category", "Unit")]
public sealed class TimeProviderExtensionsTests
{
    private sealed class FixedUtcOffsetTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }

    [Fact]
    public void UtcNowDateTime_returns_unwrapped_utc_datetime()
    {
        DateTimeOffset offset = new(2026, 3, 15, 14, 30, 45, TimeSpan.Zero);
        TimeProvider clock = new FixedUtcOffsetTimeProvider(offset);

        DateTime utc = clock.UtcNowDateTime();

        utc.Should().Be(offset.UtcDateTime);
        utc.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Fact]
    public void UtcToday_matches_date_part_of_utc_now()
    {
        DateTimeOffset offset = new(2026, 7, 4, 23, 0, 0, TimeSpan.Zero);
        TimeProvider clock = new FixedUtcOffsetTimeProvider(offset);

        DateOnly today = clock.UtcToday();

        today.Should().Be(new DateOnly(2026, 7, 4));
    }

    [Fact]
    public void UtcNowDateTime_null_provider_throws()
    {
        TimeProvider? clock = null;
        Action act = () => clock!.UtcNowDateTime();

        act.Should().Throw<ArgumentNullException>().WithParameterName("provider");
    }

    [Fact]
    public void UtcToday_null_provider_throws()
    {
        TimeProvider? clock = null;
        Action act = () => clock!.UtcToday();

        act.Should().Throw<ArgumentNullException>().WithParameterName("provider");
    }
}
