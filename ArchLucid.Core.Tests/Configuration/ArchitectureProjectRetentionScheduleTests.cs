using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureProjectRetentionScheduleTests
{
    [Theory]
    [InlineData(0, 1)]
    [InlineData(30, 30)]
    [InlineData(500, 365)]
    public void ClampRetentionDays_matches_purge_worker_bounds(int input, int expected)
    {
        ArchitectureProjectRetentionSchedule.ClampRetentionDays(input).Should().Be(expected);
    }

    [Fact]
    public void ComputePurgeAfterUtc_adds_clamped_retention_days()
    {
        DateTimeOffset deletedUtc = new(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);

        DateTimeOffset purgeAfterUtc =
            ArchitectureProjectRetentionSchedule.ComputePurgeAfterUtc(deletedUtc, 30);

        purgeAfterUtc.Should().Be(deletedUtc.AddDays(30));
    }

    [Fact]
    public void Purge_worker_eligibility_uses_strict_cutoff_at_displayed_purge_after_instant()
    {
        DateTimeOffset deletedUtc = new(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);
        int retentionDays = 30;
        DateTimeOffset purgeAfterUtc =
            ArchitectureProjectRetentionSchedule.ComputePurgeAfterUtc(deletedUtc, retentionDays);

        DateTimeOffset cutoffAtDisplayedPurgeAfter = purgeAfterUtc.AddDays(-retentionDays);

        (deletedUtc < cutoffAtDisplayedPurgeAfter).Should().BeFalse();
        (deletedUtc < purgeAfterUtc.AddTicks(1).AddDays(-retentionDays)).Should().BeTrue();
    }
}
