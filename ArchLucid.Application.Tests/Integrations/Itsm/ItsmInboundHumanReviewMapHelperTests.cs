using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmInboundHumanReviewMapHelperTests
{
    [Fact]
    public void TryConfiguredHumanReview_matches_whole_number_float_string_to_integer_map_key()
    {
        Dictionary<string, string> map = new(StringComparer.OrdinalIgnoreCase)
        {
            ["6"] = nameof(FindingHumanReviewStatus.Rejected),
        };

        bool mapped = ItsmInboundHumanReviewMapHelper.TryConfiguredHumanReview(
            map,
            "6.0",
            out string? humanReview,
            out bool invalidValue);

        mapped.Should().BeTrue();
        invalidValue.Should().BeFalse();
        humanReview.Should().Be(nameof(FindingHumanReviewStatus.Rejected));
    }

    [Theory]
    [InlineData("2147483647")]
    [InlineData("-2147483648")]
    public void TryConfiguredHumanReview_rejects_undefined_numeric_enum_values(string value)
    {
        Dictionary<string, string> map = new() { ["Done"] = value };

        bool mapped = ItsmInboundHumanReviewMapHelper.TryConfiguredHumanReview(
            map, "Done", out string? humanReview, out bool invalidValue);

        mapped.Should().BeFalse();
        invalidValue.Should().BeTrue();
        humanReview.Should().BeNull();
    }
}
