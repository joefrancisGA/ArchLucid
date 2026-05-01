using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Replay Comparison Request Mapper.
/// </summary>
[Trait("Category", "Unit")]
public sealed class ReplayComparisonRequestMapperTests
{
    [SkippableFact]
    public void ToApplicationForReplayEndpoint_prefers_query_format_when_body_is_blank()
    {
        ReplayComparisonRequest request = new()
        {
            Format = "", ReplayMode = "verify", Profile = "detailed", PersistReplay = true
        };

        Application.Analysis.ReplayComparisonRequest mapped =
            ReplayComparisonRequestMapper.ToApplicationForReplayEndpoint("cmp-1", request, "html");

        mapped.ComparisonRecordId.Should().Be("cmp-1");
        mapped.Format.Should().Be("html");
        mapped.ReplayMode.Should().Be("verify");
        mapped.Profile.Should().Be("detailed");
        mapped.PersistReplay.Should().BeTrue();
    }

    [SkippableFact]
    public void ToApplicationForReplayEndpoint_keeps_body_format_when_present()
    {
        ReplayComparisonRequest request = new() { Format = "docx" };

        Application.Analysis.ReplayComparisonRequest mapped =
            ReplayComparisonRequestMapper.ToApplicationForReplayEndpoint("cmp-2", request, "html");

        mapped.Format.Should().Be("docx");
    }

    [SkippableFact]
    public void ForSummaryMarkdown_returns_expected_defaults()
    {
        Application.Analysis.ReplayComparisonRequest mapped = ReplayComparisonRequestMapper.ForSummaryMarkdown("cmp-3");

        mapped.ComparisonRecordId.Should().Be("cmp-3");
        mapped.Format.Should().Be("markdown");
        mapped.ReplayMode.Should().Be("artifact");
        mapped.PersistReplay.Should().BeFalse();
    }

    [SkippableFact]
    public void ToApplicationForBatchEntry_maps_all_fields()
    {
        Application.Analysis.ReplayComparisonRequest mapped = ReplayComparisonRequestMapper.ToApplicationForBatchEntry(
            "cmp-4",
            "json",
            "regenerate",
            "executive",
            true);

        mapped.ComparisonRecordId.Should().Be("cmp-4");
        mapped.Format.Should().Be("json");
        mapped.ReplayMode.Should().Be("regenerate");
        mapped.Profile.Should().Be("executive");
        mapped.PersistReplay.Should().BeTrue();
    }
}
