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
            LastOpenReviewId = "run-42",
            LastOpenDraftId = "arch-9",
            LastVisitWatermarkUtc = "2026-09-05T12:00:00Z",
        };

        string json = DeskContinuityValues.Serialize(continuity);
        DeskContinuityDto? parsed = DeskContinuityValues.TryParse(json);

        parsed.Should().NotBeNull();
        parsed!.LastOpenReviewId.Should().Be("run-42");
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

        continuity.LastOpenReviewId.Should().BeNull();
        continuity.LastOpenDraftId.Should().BeNull();
        continuity.LastVisitWatermarkUtc.Should().BeNull();
    }
}
