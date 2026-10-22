using ArchLucid.Application.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class InventoryCollectionFreshnessGateTests
{
    [Fact]
    public void ShouldSuppressInventoryFindings_returns_true_when_collection_missing()
    {
        InventoryCollectionFreshnessGate
            .ShouldSuppressInventoryFindings(null, DateTime.UtcNow, 90)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void ShouldSuppressInventoryFindings_returns_true_when_collection_stale()
    {
        DateTime now = new(2026, 8, 13, 0, 0, 0, DateTimeKind.Utc);
        DateTime collected = now.AddDays(-91);

        InventoryCollectionFreshnessGate
            .ShouldSuppressInventoryFindings(collected, now, 90)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void ShouldSuppressInventoryFindings_returns_false_when_collection_fresh()
    {
        DateTime now = new(2026, 8, 13, 0, 0, 0, DateTimeKind.Utc);
        DateTime collected = now.AddDays(-10);

        InventoryCollectionFreshnessGate
            .ShouldSuppressInventoryFindings(collected, now, 90)
            .Should()
            .BeFalse();
    }
}
