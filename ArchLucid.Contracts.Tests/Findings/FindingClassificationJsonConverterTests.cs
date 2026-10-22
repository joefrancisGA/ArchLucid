using System.Text.Json;

using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingClassificationJsonConverterTests
{
    [Theory]
    [InlineData("\"DecisionGradeFinding\"", FindingClassification.DecisionGradeFinding)]
    [InlineData("1", FindingClassification.ChecklistCoverage)]
    [InlineData("1.0", FindingClassification.ChecklistCoverage)]
    public void Read_maps_defined_values(string json, FindingClassification expected)
    {
        FindingClassification value = JsonSerializer.Deserialize<FindingClassification>(json, JsonSerializerOptions.Default);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_string_numeric_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<FindingClassification>("\"99\"", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding classification value*");
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<FindingClassification>("99", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding classification value*");
    }
}
