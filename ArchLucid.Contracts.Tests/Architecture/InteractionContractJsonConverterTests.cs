using System.Text.Json;

using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class InteractionContractJsonConverterTests
{
    [Theory]
    [InlineData("\"Sync\"", InteractionContract.Sync)]
    [InlineData("0", InteractionContract.Sync)]
    [InlineData("0.0", InteractionContract.Sync)]
    [InlineData("\"Streaming\"", InteractionContract.Streaming)]
    [InlineData("3", InteractionContract.Streaming)]
    [InlineData("3.0", InteractionContract.Streaming)]
    public void Read_maps_defined_values(string json, InteractionContract expected)
    {
        InteractionContract value = JsonSerializer.Deserialize<InteractionContract>(json, JsonSerializerOptions.Default);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_string_numeric_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<InteractionContract>("\"99\"", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown interaction contract value*");
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<InteractionContract>("99", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown interaction contract value*");
    }
}
