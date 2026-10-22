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
                    ArchitectureId = "arch-1",
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
        parsed.FavoriteReviews[0].ArchitectureId.Should().Be("arch-1");
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

    [Fact]
    public void Serialize_max_normalized_payload_exceeds_legacy_user_settings_column_width()
    {
        WorkingWorkspaceContinuityDto continuity = BuildMaxNormalizedContinuity();

        string json = WorkingWorkspaceContinuityValues.Serialize(continuity);

        json.Length.Should().BeGreaterThan(512, "IH-066 payloads exceed dbo.UserSettings.PreferenceValue NVARCHAR(512)");
        json.Length.Should().BeLessThan(8000, "normalized continuity should stay within a single NVARCHAR(MAX) row");
    }

    private static WorkingWorkspaceContinuityDto BuildMaxNormalizedContinuity()
    {
        List<FavoriteReviewEntryDto> favoriteReviews = [];
        List<OperatorRecentViewEntryDto> recentViewEntries = [];

        for (int index = 0; index < 20; index++)
        {
            favoriteReviews.Add(
                new FavoriteReviewEntryDto
                {
                    RunId = $"{index:D8}-2d21-468c-b142-f184b9c78d14",
                    Title = $"Architecture review package {index}",
                    PinnedAtUtc = "2026-09-13T12:00:00.000Z",
                });
        }

        for (int index = 0; index < 8; index++)
        {
            string architectureId = $"{index:D8}-9fba-408a-b9ce-2794678c4281";

            recentViewEntries.Add(
                new OperatorRecentViewEntryDto
                {
                    Href = $"/architecture/architectures/{architectureId}",
                    Label = $"Architecture workspace {index}",
                    Kind = "architecture",
                    VisitedAtUtc = "2026-09-13T12:01:00.000Z",
                    ArchitectureId = architectureId,
                    ParentArchitectureId = $"{index:D8}-408a-b9ce-2794-678c4281abcd",
                });
        }

        return new WorkingWorkspaceContinuityDto
        {
            FavoriteReviews = favoriteReviews,
            RecentViewEntries = recentViewEntries,
            UpdatedAtUtc = "2026-09-13T12:02:00.000Z",
        };
    }
}
