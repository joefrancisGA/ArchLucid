using System.Text.Json;

using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class FeasibilityCitationKindJsonConverterTests
{
    [Theory]
    [InlineData("\"NamedLaw\"", FeasibilityCitationKind.NamedLaw)]
    [InlineData("1", FeasibilityCitationKind.NamedTheorem)]
    [InlineData("1.0", FeasibilityCitationKind.NamedTheorem)]
    public void Read_maps_defined_values(string json, FeasibilityCitationKind expected)
    {
        FeasibilityCitationKind value = JsonSerializer.Deserialize<FeasibilityCitationKind>(json, JsonSerializerOptions.Default);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_string_numeric_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<FeasibilityCitationKind>("\"99\"", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown feasibility citation kind value*");
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<FeasibilityCitationKind>("99", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown feasibility citation kind value*");
    }
}
