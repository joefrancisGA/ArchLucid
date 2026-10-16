using System.Text.Json;

using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ActorKindJsonConverterTests
{
    [Theory]
    [InlineData("\"Human\"", ActorKind.Human)]
    [InlineData("1", ActorKind.Machine)]
    [InlineData("1.0", ActorKind.Machine)]
    public void Read_maps_defined_values(string json, ActorKind expected)
    {
        ActorKind value = JsonSerializer.Deserialize<ActorKind>(json, JsonSerializerOptions.Default);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_string_numeric_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<ActorKind>("\"99\"", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown actor kind value*");
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<ActorKind>("99", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown actor kind value*");
    }
}
