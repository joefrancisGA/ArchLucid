using ArchLucid.Contracts.User;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

[Trait("Category", "Unit")]
public sealed class DeskContinuityValuesTests
{
    [Fact]
    public void Serialize_round_trips_last_open_ids_and_watermark()
    {
        DeskContinuityDto continuity = new()
        {
            LastOpenArchitectureId = "arch-locator-1",
            LastOpenReviewId = "run-42",
            LastOpenDraftId = "arch-9",
            LastVisitWatermarkUtc = "2026-09-05T12:00:00Z",
        };

        string json = DeskContinuityValues.Serialize(continuity);
        DeskContinuityDto? parsed = DeskContinuityValues.TryParse(json);

        parsed.Should().NotBeNull();
        parsed!.LastOpenArchitectureId.Should().Be("arch-locator-1");
        parsed.LastOpenReviewId.Should().Be("run-42");
        parsed.LastOpenDraftId.Should().Be("arch-9");
        parsed.LastVisitWatermarkUtc.Should().Be("2026-09-05T12:00:00Z");
    }

    [Fact]
    public void TryParse_rejects_invalid_json()
    {
        DeskContinuityValues.TryParse("{not-json").Should().BeNull();
    }

    [Fact]
    public void NormalizeOrDefault_returns_default_when_unset()
    {
        DeskContinuityDto continuity = DeskContinuityValues.NormalizeOrDefault(null);

        continuity.LastOpenArchitectureId.Should().BeNull();
        continuity.LastOpenReviewId.Should().BeNull();
        continuity.LastOpenDraftId.Should().BeNull();
        continuity.LastVisitWatermarkUtc.Should().BeNull();
    }

    [Fact]
    public void ApplyReadBackfill_promotes_architecture_id_from_review_lookup_without_dropping_child()
    {
        DeskContinuityDto legacy = new()
        {
            LastOpenReviewId = "run-42",
            LastOpenDraftId = "draft-9",
            LastVisitWatermarkUtc = "2026-09-05T12:00:00Z",
        };

        DeskContinuityDto backfilled = DeskContinuityValues.ApplyReadBackfill(legacy, "arch-locator-1");

        backfilled.LastOpenArchitectureId.Should().Be("arch-locator-1");
        backfilled.LastOpenReviewId.Should().Be("run-42");
        backfilled.LastOpenDraftId.Should().Be("draft-9");
        backfilled.LastVisitWatermarkUtc.Should().Be("2026-09-05T12:00:00Z");
    }

    [Fact]
    public void ApplyReadBackfill_leaves_continuity_unchanged_when_locator_already_set()
    {
        DeskContinuityDto continuity = new()
        {
            LastOpenArchitectureId = "arch-existing",
            LastOpenReviewId = "run-42",
        };

        DeskContinuityDto backfilled = DeskContinuityValues.ApplyReadBackfill(continuity, "arch-other");

        backfilled.LastOpenArchitectureId.Should().Be("arch-existing");
    }
}
