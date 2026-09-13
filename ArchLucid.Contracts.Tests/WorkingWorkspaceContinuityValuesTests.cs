using ArchLucid.Contracts.User;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

[Trait("Category", "Unit")]
public sealed class WorkingWorkspaceContinuityValuesTests
{
    [Fact]
    public void Serialize_round_trips_pins_and_recents()
    {
        WorkingWorkspaceContinuityDto continuity = new()
        {
            FavoriteReviews =
            [
                new FavoriteReviewEntryDto
                {
                    RunId = "run-1",
                    Title = "Payments",
                    PinnedAtUtc = "2026-09-13T12:00:00Z",
                },
            ],
            RecentViewEntries =
            [
                new OperatorRecentViewEntryDto
                {
                    Href = "/architecture/architectures/arch-1",
                    Label = "Architecture",
                    Kind = "architecture",
                    VisitedAtUtc = "2026-09-13T12:01:00Z",
                    ArchitectureId = "arch-1",
                },
            ],
            UpdatedAtUtc = "2026-09-13T12:02:00Z",
        };

        string json = WorkingWorkspaceContinuityValues.Serialize(continuity);
        WorkingWorkspaceContinuityDto? parsed = WorkingWorkspaceContinuityValues.TryParse(json);

        parsed.Should().NotBeNull();
        parsed!.FavoriteReviews.Should().HaveCount(1);
        parsed.FavoriteReviews[0].RunId.Should().Be("run-1");
        parsed.RecentViewEntries.Should().HaveCount(1);
        parsed.RecentViewEntries[0].ArchitectureId.Should().Be("arch-1");
        parsed.UpdatedAtUtc.Should().Be("2026-09-13T12:02:00Z");
    }

    [Fact]
    public void TryParse_rejects_invalid_json()
    {
        WorkingWorkspaceContinuityValues.TryParse("{not-json").Should().BeNull();
    }

    [Fact]
    public void NormalizeOrDefault_returns_default_when_unset()
    {
        WorkingWorkspaceContinuityDto continuity = WorkingWorkspaceContinuityValues.NormalizeOrDefault(null);

        continuity.FavoriteReviews.Should().BeEmpty();
        continuity.RecentViewEntries.Should().BeEmpty();
        continuity.UpdatedAtUtc.Should().BeNull();
    }
}
