using ArchLucid.Persistence.Coordination;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Coordination;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CoordinationOutboxRepositoryCoreTests
{
    [Fact]
    public void ClampDequeueBatch_clamps_to_max()
    {
        CoordinationOutboxRepositoryCore.ClampDequeueBatch(500).Should().Be(100);
        CoordinationOutboxRepositoryCore.ClampDequeueBatch(0).Should().Be(1);
    }

    [Fact]
    public void IsEligibleForDequeue_requires_unlocked_pending_row()
    {
        DateTime now = new(2026, 9, 2, 12, 0, 0, DateTimeKind.Utc);

        CoordinationOutboxRepositoryCore.IsEligibleForDequeue(null, null, null, null, now).Should().BeTrue();
        CoordinationOutboxRepositoryCore.IsEligibleForDequeue(now, null, null, null, now).Should().BeFalse();
        CoordinationOutboxRepositoryCore.IsEligibleForDequeue(null, now, null, null, now).Should().BeFalse();
        CoordinationOutboxRepositoryCore.IsEligibleForDequeue(null, null, now.AddMinutes(1), null, now).Should().BeFalse();
        CoordinationOutboxRepositoryCore.IsEligibleForDequeue(null, null, null, now.AddMinutes(1), now).Should().BeFalse();
    }

    [Fact]
    public void NormalizeUtc_converts_unspecified_to_utc()
    {
        DateTime value = new(2026, 9, 2, 8, 0, 0, DateTimeKind.Unspecified);
        CoordinationOutboxRepositoryCore.NormalizeUtc(value).Kind.Should().Be(DateTimeKind.Utc);
    }
}
