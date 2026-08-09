using ArchLucid.Host.Core.Hosted;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AdaptiveOutboxIdleBackoffTests
{
    [Fact]
    public void NextDelay_returns_zero_while_batches_return_work()
    {
        AdaptiveOutboxIdleBackoff backoff = new();

        backoff.NextDelay(5).Should().Be(TimeSpan.Zero);
        backoff.NextDelay(1).Should().Be(TimeSpan.Zero);
    }

    [Fact]
    public void NextDelay_doubles_idle_delay_up_to_cap()
    {
        AdaptiveOutboxIdleBackoff backoff = new();

        backoff.NextDelay(0).Should().Be(TimeSpan.FromSeconds(1));
        backoff.NextDelay(0).Should().Be(TimeSpan.FromSeconds(2));
        backoff.NextDelay(0).Should().Be(TimeSpan.FromSeconds(4));
        backoff.NextDelay(0).Should().Be(TimeSpan.FromSeconds(8));
        backoff.NextDelay(0).Should().Be(AdaptiveOutboxIdleBackoff.MaxIdleDelay);
        backoff.NextDelay(0).Should().Be(AdaptiveOutboxIdleBackoff.MaxIdleDelay);
    }

    [Fact]
    public void NextDelay_resets_to_base_after_work_arrives()
    {
        AdaptiveOutboxIdleBackoff backoff = new();

        backoff.NextDelay(0);
        backoff.NextDelay(0);
        backoff.NextDelay(3).Should().Be(TimeSpan.Zero);
        backoff.NextDelay(0).Should().Be(AdaptiveOutboxIdleBackoff.BaseIdleDelay);
    }

    [Fact]
    public void NextDelay_honors_custom_base_and_max_idle_delays()
    {
        AdaptiveOutboxIdleBackoff backoff = new(
            baseIdleDelay: TimeSpan.FromMilliseconds(500),
            maxIdleDelay: TimeSpan.FromSeconds(15));

        backoff.NextDelay(0).Should().Be(TimeSpan.FromMilliseconds(500));
        backoff.NextDelay(0).Should().Be(TimeSpan.FromSeconds(1));
        backoff.NextDelay(0).Should().Be(TimeSpan.FromSeconds(2));
        backoff.NextDelay(0).Should().Be(TimeSpan.FromSeconds(4));
        backoff.NextDelay(0).Should().Be(TimeSpan.FromSeconds(8));
        backoff.NextDelay(0).Should().Be(TimeSpan.FromSeconds(15));
        backoff.NextDelay(0).Should().Be(TimeSpan.FromSeconds(15));
    }
}
