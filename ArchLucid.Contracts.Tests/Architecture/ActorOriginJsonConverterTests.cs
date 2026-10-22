using System.Text.Json;

using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ActorOriginJsonConverterTests
{
    [Theory]
    [InlineData("\"Asserted\"", ActorOrigin.Asserted)]
    [InlineData("1", ActorOrigin.Inferred)]
    [InlineData("1.0", ActorOrigin.Inferred)]
    public void Read_maps_defined_values(string json, ActorOrigin expected)
    {
        ActorOrigin value = JsonSerializer.Deserialize<ActorOrigin>(json, JsonSerializerOptions.Default);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_string_numeric_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<ActorOrigin>("\"99\"", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown actor origin value*");
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<ActorOrigin>("99", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown actor origin value*");
    }
}
