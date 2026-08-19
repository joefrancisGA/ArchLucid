using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.DataConsistency;

using FluentAssertions;

namespace ArchLucid.Host.Composition.Tests.DataConsistency;

/// <summary>Unit-tests pure enforcement predicates backing <see cref="DataConsistencyOrphanProbeExecutor"/>.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DataConsistencyEnforcementPolicyTests
{
    [Theory]
    [InlineData(DataConsistencyEnforcementMode.Off)]
    [InlineData(DataConsistencyEnforcementMode.Warn)]
    [InlineData(DataConsistencyEnforcementMode.Alert)]
    [InlineData(DataConsistencyEnforcementMode.Quarantine)]
    public void UsesAlertCounters_only_for_Alert_or_Quarantine(DataConsistencyEnforcementMode mode)
    {
        bool expected = mode is DataConsistencyEnforcementMode.Alert or DataConsistencyEnforcementMode.Quarantine;

        DataConsistencyEnforcementPolicy.UsesAlertCounters(mode).Should().Be(expected);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(-1, 1)]
    [InlineData(42, 42)]
    public void NormalizeAlertThreshold_never_below_one(int configured, int expected)
    {
        DataConsistencyEnforcementPolicy.NormalizeAlertThreshold(configured).Should().Be(expected);
    }

    [Theory]
    [InlineData(0L, 1, false)]
    [InlineData(1L, 1, true)]
    [InlineData(5L, 10, false)]
    [InlineData(10L, 10, true)]
    [InlineData(-3L, 1, false)]
    public void IsAlertEligible_respects_normalized_threshold(long count, int threshold, bool eligible)
    {
        DataConsistencyEnforcementPolicy.IsAlertEligible(count, threshold).Should().Be(eligible);
    }

    [Theory]
    [InlineData(DataConsistencyEnforcementMode.Warn, false, 0L, false)]
    [InlineData(DataConsistencyEnforcementMode.Warn, true, 0L, false)]
    [InlineData(DataConsistencyEnforcementMode.Warn, false, 5L, false)]
    [InlineData(DataConsistencyEnforcementMode.Warn, true, 5L, true)]
    [InlineData(DataConsistencyEnforcementMode.Quarantine, false, 5L, true)]
    [InlineData(DataConsistencyEnforcementMode.Quarantine, true, 5L, true)]
    [InlineData(DataConsistencyEnforcementMode.Alert, false, 5L, false)]
    [InlineData(DataConsistencyEnforcementMode.Alert, true, 5L, true)]
    public void ShouldAttemptOrphanRowQuarantine_matches_host_behavior(
        DataConsistencyEnforcementMode mode,
        bool autoQuarantine,
        long orphanCount,
        bool expected)
    {
        DataConsistencyEnforcementPolicy.ShouldAttemptOrphanRowQuarantine(mode, autoQuarantine, orphanCount)
            .Should()
            .Be(expected);
    }

    [Fact]
    public void ShouldAttemptGoldenManifestQuarantine_delegates_to_orphan_row_quarantine()
    {
        DataConsistencyEnforcementPolicy.ShouldAttemptGoldenManifestQuarantine(DataConsistencyEnforcementMode.Warn, true, 4L)
            .Should()
            .Be(DataConsistencyEnforcementPolicy.ShouldAttemptOrphanRowQuarantine(DataConsistencyEnforcementMode.Warn, true, 4L));
    }

    [Fact]
    public void ShouldAttemptFindingsSnapshotQuarantine_delegates_to_orphan_row_quarantine()
    {
        DataConsistencyEnforcementPolicy.ShouldAttemptFindingsSnapshotQuarantine(DataConsistencyEnforcementMode.Quarantine, false, 2L)
            .Should()
            .Be(DataConsistencyEnforcementPolicy.ShouldAttemptOrphanRowQuarantine(DataConsistencyEnforcementMode.Quarantine, false, 2L));
    }

    [Theory]
    [InlineData(DataConsistencyEnforcementMode.Off, false)]
    [InlineData(DataConsistencyEnforcementMode.Warn, true)]
    [InlineData(DataConsistencyEnforcementMode.Alert, true)]
    [InlineData(DataConsistencyEnforcementMode.Quarantine, true)]
    public void ShouldEvaluateEnforcement_skips_when_off(DataConsistencyEnforcementMode mode, bool expected)
    {
        DataConsistencyEnforcementPolicy.ShouldEvaluateEnforcement(mode).Should().Be(expected);
    }
}
