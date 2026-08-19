using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Diagnostics;

[Trait("Category", "Unit")]
public sealed class StaleInFlightRunGaugeStateTests
{
    [Fact]
    public void Publish_updates_Current_atomically_visible()
    {
        StaleInFlightRunGaugeState state = new();
        StaleInFlightRunGaugeValues first = new(2, 3900.5);
        StaleInFlightRunGaugeValues second = new(0, 0);

        state.Publish(in first);
        state.Current.Should().Be(first);

        state.Publish(in second);
        state.Current.Should().Be(second);
    }

    [Fact]
    public void Publish_exposes_count_and_oldest_age()
    {
        StaleInFlightRunGaugeState state = new();
        StaleInFlightRunGaugeValues values = new(3, 7200);

        state.Publish(in values);

        state.Current.StaleInFlightCount.Should().Be(3);
        state.Current.OldestStaleAgeSeconds.Should().Be(7200);
    }
}
