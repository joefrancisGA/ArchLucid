using System.Text.Json;

using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingConfidenceLevelJsonConverterTests
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    [Theory]
    [InlineData("0", FindingConfidenceLevel.High)]
    [InlineData("\"Medium\"", FindingConfidenceLevel.Medium)]
    public void Deserialize_maps_defined_values(string json, FindingConfidenceLevel expected)
    {
        FindingConfidenceLevel value = JsonSerializer.Deserialize<FindingConfidenceLevel>(json, Options);

        value.Should().Be(expected);
    }

    [Fact]
    public void Deserialize_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<FindingConfidenceLevel>("99", Options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding confidence level value*");
    }
}
