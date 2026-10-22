using System.Text.Json;

using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class TrustOriginJsonConverterTests
{
    [Theory]
    [InlineData("\"Internal\"", TrustOrigin.Internal)]
    [InlineData("1", TrustOrigin.External)]
    [InlineData("1.0", TrustOrigin.External)]
    public void Read_maps_defined_values(string json, TrustOrigin expected)
    {
        TrustOrigin value = JsonSerializer.Deserialize<TrustOrigin>(json, JsonSerializerOptions.Default);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_string_numeric_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<TrustOrigin>("\"99\"", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown trust origin value*");
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<TrustOrigin>("99", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown trust origin value*");
    }
}
