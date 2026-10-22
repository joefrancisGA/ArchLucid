using ArchLucid.Application.Architecture;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureInventorySnapshotFreshnessTests
{
    [Fact]
    public void IsStale_returns_false_when_captured_utc_is_missing()
    {
        DateTime now = new(2026, 9, 9, 12, 0, 0, DateTimeKind.Utc);

        ArchitectureInventorySnapshotFreshness.IsStale(null, now).Should().BeFalse();
    }

    [Fact]
    public void IsStale_returns_false_when_captured_within_seven_days()
    {
        DateTime now = new(2026, 9, 9, 12, 0, 0, DateTimeKind.Utc);
        DateTime captured = now.AddDays(-6);

        ArchitectureInventorySnapshotFreshness.IsStale(captured, now).Should().BeFalse();
    }

    [Fact]
    public void IsStale_returns_true_when_captured_at_or_beyond_seven_days()
    {
        DateTime now = new(2026, 9, 9, 12, 0, 0, DateTimeKind.Utc);
        DateTime captured = now.AddDays(-7);

        ArchitectureInventorySnapshotFreshness.IsStale(captured, now).Should().BeTrue();
        ArchitectureInventorySnapshotFreshness.StaleAfterDays.Should().Be(7);
    }
}
