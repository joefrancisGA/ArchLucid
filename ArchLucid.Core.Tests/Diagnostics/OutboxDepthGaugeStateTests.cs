using ArchiForge.Core.Diagnostics;

using FluentAssertions;

namespace ArchiForge.Core.Tests.Diagnostics;

public sealed class OutboxDepthGaugeStateTests
{
    [Fact]
    public void Publish_updates_Current_atomically_visible()
    {
        OutboxDepthGaugeState state = new();
        OutboxDepthGaugeValues first = new(1, 2, 3, 4, 5, 6, 7);
        OutboxDepthGaugeValues second = new(10, 20, 30, 40, 50, 60, 70);

        state.Publish(in first);
        state.Current.Should().Be(first);

        state.Publish(in second);
        state.Current.Should().Be(second);
    }
}
