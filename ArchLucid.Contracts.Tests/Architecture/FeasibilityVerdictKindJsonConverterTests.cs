using System.Text.Json;

using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class FeasibilityVerdictKindJsonConverterTests
{
    [Theory]
    [InlineData("\"Feasible\"", FeasibilityVerdictKind.Feasible)]
    [InlineData("1", FeasibilityVerdictKind.SoftInfeasible)]
    [InlineData("1.0", FeasibilityVerdictKind.SoftInfeasible)]
    public void Read_maps_defined_values(string json, FeasibilityVerdictKind expected)
    {
        FeasibilityVerdictKind value = JsonSerializer.Deserialize<FeasibilityVerdictKind>(json, JsonSerializerOptions.Default);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_string_numeric_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<FeasibilityVerdictKind>("\"99\"", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown feasibility verdict kind value*");
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<FeasibilityVerdictKind>("99", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown feasibility verdict kind value*");
    }
}
