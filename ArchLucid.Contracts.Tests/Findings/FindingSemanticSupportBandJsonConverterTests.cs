using System.Text.Json;

using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingSemanticSupportBandJsonConverterTests
{
    [Theory]
    [InlineData("\"Supported\"", FindingSemanticSupportBand.Supported)]
    [InlineData("1", FindingSemanticSupportBand.Unchecked)]
    [InlineData("1.0", FindingSemanticSupportBand.Unchecked)]
    public void Read_maps_defined_values(string json, FindingSemanticSupportBand expected)
    {
        FindingSemanticSupportBand value = JsonSerializer.Deserialize<FindingSemanticSupportBand>(json, JsonSerializerOptions.Default);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_string_numeric_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<FindingSemanticSupportBand>("\"99\"", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding semantic support band value*");
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<FindingSemanticSupportBand>("99", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding semantic support band value*");
    }
}
