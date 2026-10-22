using System.Text.Json;

using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingHumanReviewStatusJsonConverterTests
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    [Theory]
    [InlineData("1", FindingHumanReviewStatus.Pending)]
    [InlineData("\"Approved\"", FindingHumanReviewStatus.Approved)]
    public void Read_maps_defined_values(string json, FindingHumanReviewStatus expected)
    {
        FindingHumanReviewStatus value = JsonSerializer.Deserialize<FindingHumanReviewStatus>(json, Options);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<FindingHumanReviewStatus>("99", Options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding human review status value*");
    }
}
