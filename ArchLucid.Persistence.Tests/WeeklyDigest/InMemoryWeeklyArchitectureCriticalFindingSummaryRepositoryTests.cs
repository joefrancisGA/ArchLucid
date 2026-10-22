using ArchLucid.Persistence.WeeklyDigest;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.WeeklyDigest;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryWeeklyArchitectureCriticalFindingSummaryRepositoryTests
{
    [Fact]
    public async Task ListRecentCriticalAsync_returns_empty_slice()
    {
        InMemoryWeeklyArchitectureCriticalFindingSummaryRepository sut = new();

        WeeklyArchitectureCriticalFindingsSlice slice = await sut.ListRecentCriticalAsync(
            DateTime.UtcNow.AddDays(-7),
            "Critical",
            maxSampleRows: 25,
            CancellationToken.None);

        slice.ApproximateMatchingCount.Should().Be(0);
        slice.SampleRows.Should().BeEmpty();
    }
}
